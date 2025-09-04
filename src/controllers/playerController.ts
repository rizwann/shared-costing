import { Request, Response } from "express";
import PlayerStat from "../models/PlayerStat";
import StatMeta from "../models/StatMeta";
import axios from "axios";
import { Match } from "../models/Match";
import puppeteer from "puppeteer";
const url = 'https://cricheroes.com/team-profile/2379140/dusseldorf-rampagers/members';

export async function scrapeMembers(req: Request, res: Response) {
  res.status(200).json({ message: 'Scraping started' })
  console.log('Player stats creating started 1')

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    
    const page = await browser.newPage();
    console.log('Player stats creating started 2')
  
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  
      // Evaluate the page to extract members data
      const members = await page.evaluate(() => {
        // Find the script tag containing the JSON data
        const scriptTag = Array.from(document.querySelectorAll('script')).find(script => script.innerText.includes('"members":['));
        if (!scriptTag) {
          throw new Error('Members data not found');
        }
  
        // Extract the "members" array portion from the script content
        const match = scriptTag.innerText.match(/"members":\[(.+?)\](?=,)/);
        if (!match) {
          throw new Error('Failed to extract members array');
        }
  
        // Parse the members array
        const membersArray = JSON.parse(`[${match[1]}]`);
        return membersArray;
      });
      const membersWithProfileLink = members.map((member: any) => {
        return {
          ...member,
          profileLink: `https://cricheroes.com/player-profile/${member.player_id}/${member.name.split(' ').join('-')}/stats`,
        };
      }
      );
    
  
       // now go to each player profile page and extract the stats one by one without closing the browser instance
       for (let i = 0; i < membersWithProfileLink.length; i++) {
        try {
          await page.goto(membersWithProfileLink[i].profileLink, { waitUntil: 'networkidle2', timeout: 0 });
      
          // Wait for batting stats
          await page.waitForSelector('.statWrapper', { timeout: 10000 });
      
          // Extract Batting Stats
          const battingStats = await page.evaluate(() => {
            const stats = Array.from(document.querySelectorAll('.statWrapper')).map(stat => {
              const statValue = (stat.querySelector('.stat') as HTMLElement)?.innerText || '';
              const statName = (stat.querySelector('.statName') as HTMLElement)?.innerText || '';
              return { [statName]: statValue };
            });
            return stats;
          });
      
          // Try clicking on Bowling tab
          const bowlingTabExists = await page.evaluate(() => {
            const tab = document.querySelector('[value="bowling"]') as HTMLElement;
            if (tab) {
              tab.click();
              return true;
            }
            return false;
          });
      
          let bowlingStats
      
          if (bowlingTabExists) {
            try {
              await page.waitForSelector('.statWrapper', { timeout: 10000 });
              bowlingStats = await page.evaluate(() => {
                const stats = Array.from(document.querySelectorAll('.statWrapper')).map(stat => {
                  const statValue = (stat.querySelector('.stat') as HTMLElement)?.innerText || '';
                  const statName = (stat.querySelector('.statName') as HTMLElement)?.innerText || '';
                  return { [statName]: statValue };
                });
                return stats;
              });
            } catch (err) {
              console.warn(`Bowling stats not found for player ${membersWithProfileLink[i].name}`);
            }
          } else {
            console.warn(`Bowling tab not available for player ${membersWithProfileLink[i].name}`);
          }

      // / Try clicking on Fielding tab
          const fieldingTabExists = await page.evaluate(() => {
            const tab = document.querySelector('[value="fielding"]') as HTMLElement;
            if (tab) {
              tab.click();
              return true;
            } 
            return false;
          }
          );
          let fieldingStats
          if (fieldingTabExists) {
            try {
              await page.waitForSelector('.statWrapper', { timeout: 10000 });
              fieldingStats = await page.evaluate(() => {
                const stats = Array.from(document.querySelectorAll('.statWrapper')).map(stat => {
                  const statValue = (stat.querySelector('.stat') as HTMLElement)?.innerText || '';
                  const statName = (stat.querySelector('.statName') as HTMLElement)?.innerText || '';
                  return { [statName]: statValue };
                });
                return stats;
              });
            } catch (err) {
              console.warn(`Fielding stats not found for player ${membersWithProfileLink[i].name}`);
            }
          } else {
            console.warn(`Fielding tab not available for player ${membersWithProfileLink[i].name}`);
          }

          const player = {
            ...membersWithProfileLink[i],
            stats: {
              batting: battingStats ? battingStats.reduce((acc: any, stat: any) => {
                const key = Object.keys(stat)[0];
                acc[key] = stat[key];
                return acc;
              }
              , {}) : null,
              bowling: bowlingStats ? bowlingStats.reduce((acc: any, stat: any) => {
                const key = Object.keys(stat)[0];
                acc[key] = stat[key];
                return acc;
              }, {}) : null,
              fielding: fieldingStats ? fieldingStats.reduce((acc: any, stat: any) => {
                const key = Object.keys(stat)[0];
                acc[key] = stat[key];
                return acc;
              }, {}) : null,
            }
          };
          const existingPlayer = await PlayerStat.findOne({ player_id: player.player_id });
          if (existingPlayer) {
            existingPlayer.set(player);
            await existingPlayer.save();
            console.log(`✅ Player ${player.name} stats updated`);
          } else {
            await PlayerStat.create(player);
            console.log(`🆕 Player ${player.name} stats saved`);
          }
          // delete the players from database if they are not in the members list
          try {
            const allPlayers = await PlayerStat.find();
            const playersToDelete = allPlayers.filter((player: any) => !membersWithProfileLink.some((member: any) => member.player_id === player.player_id));
            for (const player of playersToDelete) {
              await PlayerStat.deleteOne({ _id: player._id });
              console.log(`❌ Player ${player.name} deleted`);
            }
          }
          catch (deleteError) {
            console.error(`❌ Error deleting player ${membersWithProfileLink[i].name}:`, deleteError);
          }
          
        } catch (playerError) {
          console.error(`❌ Error scraping player ${membersWithProfileLink[i].name}:`, playerError);
        }
      }

      await StatMeta.deleteMany();
      await StatMeta.create({ lastUpdated: new Date() })
      console.log('Players stats created successfully')
    } catch (error) {
      console.error('Error:', error);
    } finally {
      await browser.close();
    }
  }


  // export const scrapTeamDetails = async (req: Request, res: Response) => {
  //   res.status(200).json({ message: 'Scraping started' })
  // const url = 'https://cricheroes.com/team-profile/2379140/dusseldorf-rampagers/matches';
  //     const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      
  //     const page = await browser.newPage();
    
  //     try {
  //       await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36');
  //       await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
      
  //       // Wait for batting stats
  //       await page.waitForSelector('.card', { timeout: 10000 });
  //      console.log('match scrapping started 3')
        
  //       const matches = await page.evaluate(() => {
  //         const cards = Array.from(document.querySelectorAll('.card'));
  //         return cards.map(stat => {
  //           const tournament = (stat.querySelector('i') as HTMLElement)?.textContent || '';
  //           const venueAndDate = (stat.querySelector('.left p') as HTMLElement)?.textContent || '';
  //           const matchType = (stat.querySelector('.round') as HTMLElement)?.textContent || '';
  //           const status = (stat.querySelector('.badge-wrapper') as HTMLElement)?.getAttribute('type') || '';
  //           const teams = Array.from(stat.querySelectorAll('.sc-fb7dbe02-9')).map(el => el.textContent?.trim() || '');
  //           const result = (stat.querySelector('.RfBqv span') as HTMLElement)?.textContent || '';
  //           const link = stat.querySelector('a')?.getAttribute('href');
  //           const fullLink = link ? `https://cricheroes.com${link}` : null;
            
        
  //           return { tournament, venueAndDate, matchType, status, teams, result, link: fullLink, scoreImage: '' };
  //         });
  //       });
  //       for (const match of matches) {
  //         if (match.link) {
  //           try {
  //             const matchPage = await browser.newPage();
  //             await matchPage.setViewport({ width: 1280, height: 800 });
  //             await matchPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  //             await matchPage.goto(match.link, { waitUntil: 'networkidle2', timeout: 0 });
        
  //             // Wait for the summary container to appear
  //             await matchPage.waitForSelector('.sc-1a994d2e-16', { timeout: 10000 });
        
  //             const scoreSection = await matchPage.$('.sc-1a994d2e-16');
  //             if (scoreSection) {
  //               const fileName = `score-${match.teams[0].replace(/\s/g, '-')}-vs-${match.teams[1].replace(/\s/g, '-')}.png`;
  //               await scoreSection.screenshot({ path: `./public/scores/${fileName}` });
  //               match.scoreImage = `/scores/${fileName}`;
  //             } else {
  //               match.scoreImage = 'Score section not found';
  //             }
        
  //             await matchPage.close();
  //           } catch (error) {
  //             console.error(`Failed to capture screenshot for ${match.link}`, error);
  //             match.scoreImage = 'Error capturing screenshot';
  //           }
  //         }
  //       }
        
        
  //       console.log(matches)

  //       // await StatMeta.deleteMany();
  //       // await StatMeta.create({ lastUpdated: new Date() })
  //       console.log('Matches created successfully')
  //     }
  //       catch (error) {
  //         console.error('Error:', error);
  //       } finally {
  //         await browser.close();
  //       }
  // };

  const getCurrentBuildId = async (page:any): Promise<string | null> => {
    try {
      await page.goto('https://cricheroes.com', { waitUntil: 'domcontentloaded', timeout: 0 });
  
      const buildId = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const buildScript = scripts.find(s => (s as HTMLScriptElement).src.includes('_next/static') && (s as HTMLScriptElement).src.includes('_buildManifest.js'));
        if (!buildScript) return null;
  
        const src = (buildScript as HTMLScriptElement).src;
        const match = src.match(/_next\/static\/([^\/]+)\//);
        return match ? match[1] : null;
      });
  
      return buildId;
    } catch (error) {
      console.error('Error getting build ID:', error);
      return null;
    }
  };
  
  // export const scrapTeamDetails = async (req: Request, res: Response) => {
  //   res.status(200).json({ message: 'Scraping started' });
  
  //   const url = 'https://cricheroes.com/team-profile/2379140/dusseldorf-rampagers/matches';
  //   const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  //   const page = await browser.newPage();
  
  //   try {
  //     // Block images/fonts to make it faster
  //     await page.setRequestInterception(true);
  //     page.on('request', (request) => {
  //       if (['image', 'font', 'stylesheet'].includes(request.resourceType())) {
  //         request.abort();
  //       } else {
  //         request.continue();
  //       }
  //     });
  
  //     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      
  //     const buildId = await getCurrentBuildId(page);
  //     if (!buildId) throw new Error('Failed to retrieve build ID');
  
  //     // Go to matches page
  //     await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  
  //     await page.waitForSelector('.card', { timeout: 10000 });
  //     console.log('Scraping matches...');
  
  //     const matches = await page.evaluate(() => {
  //       const cards = Array.from(document.querySelectorAll('.card'));
  //       return cards.map(stat => {
  //         const tournament = (stat.querySelector('i') as HTMLElement)?.textContent || '';
  //         const venueAndDate = (stat.querySelector('.left p') as HTMLElement)?.textContent || '';
  //         const matchType = (stat.querySelector('.round') as HTMLElement)?.textContent || '';
  //         const status = (stat.querySelector('.badge-wrapper') as HTMLElement)?.getAttribute('type') || '';
  //         const teams = Array.from(stat.querySelectorAll('.sc-fb7dbe02-9')).map(el => el.textContent?.trim() || '');
  //         const result = (stat.querySelector('.RfBqv span') as HTMLElement)?.textContent || '';
  //         const link = stat.querySelector('a')?.getAttribute('href');
  //         const fullLink = link ? `https://cricheroes.com${link}` : null;
  
  //         return { tournament, venueAndDate, matchType, status, teams, result, link: fullLink, score: {} };
  //       });
  //     });
  
  //     // Fetch scores for each match
  //     for (const match of matches) {
  //       if (match.link) {
  //         try {
  //           const urlParts = match.link.split('/').filter(Boolean);
  //           const matchIdIndex = urlParts.indexOf('scorecard') + 1;
  //           const matchId = urlParts[matchIdIndex];
  //           const tournamentName = urlParts[matchIdIndex + 1];
  //           const teamNames = urlParts[matchIdIndex + 2];
  
  //           const jsonUrl = `https://cricheroes.com/_next/data/${buildId}/scorecard/${matchId}/${tournamentName}/${teamNames}/scorecard.json?matchId=${matchId}&tournamentName=${tournamentName}&teamNames=${teamNames}&tab=scorecard`;
  
  //           const response = await axios.get(jsonUrl, {
  //             headers: {
  //               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  //               'Accept': 'application/json',
  //               'Accept-Language': 'en-US,en;q=0.9',
  //               'Referer': match.link,
  //             }
  //           });
  
  //           const innings = response.data?.pageProps?.scorecard || [];
  //           const scores = innings.map((inning: any) => ({
  //             teamName: inning.teamName,
  //             summary: inning.inning?.summary?.score || '',
  //             over: inning.inning?.summary?.over || ''
  //           }));
  
  //           match.score = scores.reduce((acc: any, score: { teamName: string; summary: string; over: string }) => {
  //             const { teamName, summary, over } = score;
  //             acc[teamName] = { run: summary, over };
  //             return acc;
  //           }, {});
            
  
  //           console.log("Fetched score for match:", match.teams.join(' vs '));
  //         } catch (error: any) {
  //           console.error(`Error fetching score JSON for match: ${match.link}`, error.message);
  //         }
  //       }
  //     }
  
  //     // Save matches to database
  //     await Match.deleteMany(); // Optional: Clear existing
  //     await Match.insertMany(matches);
  //     console.log('Matches saved to DB successfully.');
  
  //   } catch (error: any) {
  //     console.error('Scraping error:', error.message);
  //   } finally {
  //     await browser.close();
  //   }
  // };
  
  export const scrapTeamDetails = async (req: Request, res: Response) => {
    res.status(200).json({ message: 'Scraping started' });
  
    const url = 'https://cricheroes.com/team-profile/2379140/dusseldorf-rampagers/matches';
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
  
    try {
      // Block images/fonts to make it faster
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['image', 'font', 'stylesheet'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });
  
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  
      const buildId = await getCurrentBuildId(page);
      if (!buildId) throw new Error('Failed to retrieve build ID');
  
      // Go to matches page
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
  
      // helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Keep clicking "Load More" until it's gone
try {
  while (true) {
    const hasButton = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find(b => b.textContent?.trim() === "Load More");
      if (btn) {
        (btn as HTMLButtonElement).click();
        return true;
      }
      return false;
    });

    if (!hasButton) break;

    console.log("Clicked Load More... waiting for matches");
    await delay(2500);
  }
} catch (e) {
  console.log("No more 'Load More' button found.");
}

      await page.waitForSelector('.card', { timeout: 10000 });
      console.log('Scraping matches...');
  
      const matches = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.card'));
        return cards.map(stat => {
          const tournament = (stat.querySelector('i') as HTMLElement)?.textContent || '';
          const venueAndDate = (stat.querySelector('.left p') as HTMLElement)?.textContent || '';
          const matchType = (stat.querySelector('.round') as HTMLElement)?.textContent || '';
          const status = (stat.querySelector('.badge-wrapper') as HTMLElement)?.getAttribute('type') || '';
          const teams = Array.from(stat.querySelectorAll('.sc-fb7dbe02-9')).map(el => el.textContent?.trim() || '');
          const result = (stat.querySelector('.RfBqv span') as HTMLElement)?.textContent || '';
          const link = stat.querySelector('a')?.getAttribute('href');
          const fullLink = link ? `https://cricheroes.com${link}` : null;
  
          return { tournament, venueAndDate, matchType, status, teams, result, link: fullLink, score: {} };
        });
      });
  
      // Fetch scores for each match
      for (const match of matches) {
        if (match.link) {
          try {
            const urlParts = match.link.split('/').filter(Boolean);
            const matchIdIndex = urlParts.indexOf('scorecard') + 1;
            const matchId = urlParts[matchIdIndex];
            const tournamentName = urlParts[matchIdIndex + 1];
            const teamNames = urlParts[matchIdIndex + 2];
  
            const jsonUrl = `https://cricheroes.com/_next/data/${buildId}/scorecard/${matchId}/${tournamentName}/${teamNames}/scorecard.json?matchId=${matchId}&tournamentName=${tournamentName}&teamNames=${teamNames}&tab=scorecard`;
  
            const response = await axios.get(jsonUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': match.link,
              }
            });
  
            const innings = response.data?.pageProps?.scorecard || [];
            const scores = innings.map((inning: any) => ({
              teamName: inning.teamName,
              summary: inning.inning?.summary?.score || '',
              over: inning.inning?.summary?.over || ''
            }));
  
            match.score = scores.reduce((acc: any, score: { teamName: string; summary: string; over: string }) => {
              const { teamName, summary, over } = score;
              acc[teamName] = { run: summary, over };
              return acc;
            }, {});
  
            console.log("Fetched score for match:", match.teams.join(' vs '));
          } catch (error: any) {
            console.error(`Error fetching score JSON for match: ${match.link}`, error.message);
          }
        }
      }
  
      // Save matches to database
      await Match.deleteMany(); // Optional: Clear existing
      await Match.insertMany(matches);
      console.log('Matches saved to DB successfully.');
  
    } catch (error: any) {
      console.error('Scraping error:', error.message);
    } finally {
      await browser.close();
    }
  };
  
  export const getMatches = async (req: Request, res: Response) => {
    try {
      const matches = await Match.find();
      res.status(200).json(matches);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
  export const getPlayerStats = async (req: Request, res: Response) => {
    try {
      const players = await PlayerStat.find();
      res.status(200).json(players);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

    export const getPlayerStatById = async (req: Request, res: Response) => {
        try {
        const { id } = req.params;
    
        const player = await PlayerStat.findById(id);
    
        if (!player) {
            return res.status(404).json({ message: "Player not found" });
        }
    
        res.status(200).json(player);
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
        }
    };

    export const getLastUpdated = async (req: Request, res: Response) => {
        try {
            const lastUpdated = await StatMeta.findOne().sort({ lastUpdated: -1 });
            if (!lastUpdated) {
                return res.status(404).json({ message: "No last updated date found" });
            }
            res.status(200).json(lastUpdated);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    }
    