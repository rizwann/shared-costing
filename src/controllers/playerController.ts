import { Request, Response } from "express";
import puppeteer from "puppeteer";
import PlayerStat from "../models/PlayerStat";
import StatMeta from "../models/StatMeta";
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
    