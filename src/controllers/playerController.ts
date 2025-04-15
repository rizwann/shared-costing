import { Request, Response } from "express";
import puppeteer from "puppeteer";
import PlayerStat from "../models/PlayerStat";
import StatMeta from "../models/StatMeta";
const url = 'https://cricheroes.com/team-profile/2379140/dusseldorf-rampagers/members';


export async function scrapeMembers(req: Request, res: Response) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
  
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36');
      await page.goto(url, { waitUntil: 'networkidle2' });
  
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
        await page.goto(membersWithProfileLink[i].profileLink, { waitUntil: 'networkidle2' });
        const playerStats = await page.evaluate(() => {
            const stats = Array.from(document.querySelectorAll('.statWrapper')).map(stat => {
                const statValue = (stat.querySelector('.stat') as HTMLElement).innerText;
                const statName = (stat.querySelector('.statName') as HTMLElement).innerText;
                return {
                    [statName]: statValue,
                };
            });
            return stats;
        });
       

        const player = {
            ...membersWithProfileLink[i],
            stats: playerStats.reduce((acc, stat) => ({ ...acc, ...stat }), {}),
        }

       // save to database, and if player already exists, update the stats
        const existingPlayer = await PlayerStat.findOne({ player_id: player.player_id });
        if (existingPlayer) {
            existingPlayer.set(player);
            await existingPlayer.save();
            console.log(`Player ${player.name} stats updated successfully in the database`);
        } else {
            await PlayerStat.create(player);
            console.log(`Player ${player.name} stats saved successfully to the database`);
        }
      }
      await StatMeta.deleteMany();
      await StatMeta.create({ lastUpdated: new Date() })
      console.log('Player stats created successfully');
      res.status(201).json({ message: "Players stats created successfully", lastUpdated: new Date() })
  
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