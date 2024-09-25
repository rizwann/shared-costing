import { Request, Response } from "express";
import House from "../models/House";
import { User } from "../models/User";
import Expense from "../models/Expense";

const nodemailer = require("nodemailer")


export const createHouse = async (req: Request, res: Response) => {
  try {
    const { code, description, userId } = req.body;
    const image = req.file ? req.file.path : undefined;

    // Check for duplicate code or description
    const existingHouseWithCode = await House.findOne({ code });
    const existingHouseWithDescription = await House.findOne({ description });

    if (existingHouseWithCode) {
      return res.status(400).json({ message: "Can't accept this code" });
    }

    if (existingHouseWithDescription) {
      return res.status(400).json({ message: `House name →${description}← already exists` });
    }

    const userNames = await User.find({ _id: userId }).select("username")

    const house = new House({
      code,
      description,
      image,
      users: [userId],
      userNames: [userNames[0].username], 
    }); // Add user ID to the users array
    await house.save();
    // add house code to user's houseCodes array
    const user = await User.findById(userId);
    if (user) {
      user.houseCodes.push(code);
      await user.save();
    }

    res.status(201).json({ message: "House created successfully", house });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHouseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    res.status(200).json(house);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

export const getSingleHouse = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const house = await House.findOne({ code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    res.status(200).json(house);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getHousesByUserId = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.body.userId;
    const user = await User.findById(currentUserId);

    const admin =
      user?.username.toLocaleLowerCase() === "Rizwan".toLocaleLowerCase() ||
      user?.username === "RizwanKabir".toLocaleLowerCase();

    const houses = admin ? await House.find() : await House.find({ users: currentUserId });

    if (!houses) {
      return res.status(404).json({ message: "Houses not found" });
    }

    res.status(200).json(houses)
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserByHouseCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const house = await House.findOne({ code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const users = await User.find({ houseCodes: house.code });

    if (!users) {
      return res.status(404).json({ message: "Users not found" });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateHouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, code } = req.body;
    const image = req.file ? req.file.path : undefined;

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Check for duplicate description

    const existingHouseWithDescription = await House.findOne({
      description,
      _id: { $ne: id },
    });

    const existingHouseWithCode = await House.findOne({
      code,
      _id: { $ne: id },
      
    })
    if (existingHouseWithCode) {
      return res.status(400).json({ message: "Can't use this restricted code" });
    }

    if (existingHouseWithDescription) {
      return res.status(400).json({ message: "Duplicate name" });
    }

    house.description = description;
    if (image) {
      house.image = image;
    }
    if (code !== house.code) {
      const users = await User.find({ houseCodes: house.code });
      users.forEach(async (user) => {
        user.houseCodes = user.houseCodes.filter((code) => code !== house.code);
        user.houseCodes.push(code);
        await user.save();
      });
      const expenses = await Expense.find({ houseCode : house.code })
      expenses.forEach(async (expense) => {
        expense.houseCode = code;
        await expense.save();
      })

      house.code = code;
    }

    await house.save();

    res.status(200).json({ message: "House updated successfully", house });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteHouse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if the user is the owner of the house (check user id is in the house's users array)

    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    await House.deleteOne({ _id: id });
    // remove house code from all users
    const users = await User.find({ houseCodes: house.code });
    users.forEach(async (user) => {
      user.houseCodes = user.houseCodes.filter((code) => code !== house.code);
      await user.save();
    });
    res.status(200).json({ message: `House ${house.description} deleted` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const joinHouse = async (req: Request, res: Response) => {
  try {
    const { code, userId } = req.body;
    // Find the house with the provided code
    const house = await House.findOne({ code: code });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Add the user to the house

    const user = await User.findById(userId);

    if (user) {
      // Check if the user is not already in the house
      if (!user.houseCodes.includes(code)) {
        const FE_URL = process.env.FRONTEND_URL as string
        const sendEmail = (email: string, name: string, ownId: string) => {
        const emailLink = `${FE_URL}/accept-user/${user._id}/${house.code}/${ownId}`;
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.APP_EMAIL as string,
              pass: process.env.APP_PASSWORD as string,
            },
          })
          const mailOptions = {
            from:{
              name: "House Expense Manager",
              address: process.env.APP_EMAIL as string
            },
            to: email,
            subject: "Join House",
            html: `
            <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f3f3f3;
              }
            </style>
          </head>
          <body>
            <div class="container" style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1;">
              <img src="${process.env.LOGO_URL}" alt="House Ex Manager" class="logo" style="width: 100px; height: 100px;" />
              <h2 style="color: #333;">
               A New User wants to join your house <b>${house?.description}</b> 
              </h2>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Hello ${
                name
              },</p>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">A new user wants to join your house ${
                house?.description
              }. Click the button below to accept the user.</p>

              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;"> Email: ${
                user.email
              }</p>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;"> Username: ${
                user.username
              }</p>
              <a href="${emailLink}" class="button" style="display: inline-block; color: #ffffff; padding: 12px 20px; text-align: center; text-decoration: none; border-radius: 4px; margin-top: 20px; background-color: #7C3AED;">Accept the User</a>
              <p class="text" style="color: #333; font-size: 10px; margin-top: 20px;"><i>If you do not know the person just ignore this email</i></p>

              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Best regards,</p>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expense Manager Team</p>
            </div>
          </body>
        </html>
            `,
          };
          transporter.sendMail(mailOptions, function (error:any, info:any) {
            if (error) {
              console.log(error);
            } else {
              console.log("Email sent: " + info.response);
            }
          });
        }
        house.users.forEach(async (id) => {
          const userToEmail = await User.findById(id);
          if(userToEmail){
            sendEmail(userToEmail.email, userToEmail.name!, userToEmail._id!);
          }
        }
        )
        res.status(200).json({ message: "Email sent to house members" });
        

      } else {
        res.status(400).json({ message: "User is already in the house" });
      }
    } else {
      res.status(401).json({
        message: "You are not registered with us... who the fuck are you!!!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const acceptUser = async (req: Request, res: Response) => {
  const { id, houseCode, ownId } = req.params
  const userAccepting = await User.findById(ownId)
  const user = await User.findById(id);
  const house = await House.findOne({ code: houseCode })

  if (!house) {
    return res.status(404).json({ message: "House not found" })
  }

  if (user) {
    if(!user.houseCodes.includes(houseCode)){
    user.houseCodes.push(houseCode) 
    await user.save()
    if (!house.users.includes(user._id)) {
      house.users.push(user._id) // Add the user to the house's users array
      // add user name to house's userNames array
      house.userNames.push(user.username)
      await house.save()
    }
    const sendEmail = (email: string, name: string) => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.APP_EMAIL as string,
          pass: process.env.APP_PASSWORD as string,
        },
      })
      const mailOptions = {
        from: {
          name: "House Expense Manager",
          address: process.env.APP_EMAIL as string,
        },
        to: email,
        subject: "Join House",
        html: `
            <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f3f3f3;
              }
            </style>
          </head>
          <body>
            <div class="container" style="background-color: #ffffff; border-radius: 5px; padding: 20px; margin: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1;">
              <img src="${
                process.env.LOGO_URL
              }" alt="House Ex Manager" class="logo" style="width: 100px; height: 100px;" />
              <h2 style="color: #333;">
               You are now a member of the house => <b>${
                 house?.description
               }</b> 
              </h2>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Hello ${name},</p>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">
              ${
                userAccepting && userAccepting.username
              } has accepted your request to join  ${house?.description}.</p>

              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Best regards,</p>
              <p class="text" style="color: #333; font-size: 16px; margin-top: 20px;">Your House Expense Manager Team</p>
            </div>
          </body>
        </html>
            `,
      }
      transporter.sendMail(mailOptions, function (error: any, info: any) {
        if (error) {
          console.log(error)
        } else {
          console.log("Email sent: " + info.response)
        }
      })
    }

    sendEmail(user.email, user.name!)
    res.status(200).json({ message: "Joined house successfully" })
  } else {
    res.status(400).json({ message: "User is already in the house" })
  }
  } else {
    res.status(401).json({
      message: "User Not Found",
    })
  }
}

export const getAllHouses = async (req: Request, res: Response) => {
  try {
    const houses = await House.find();

    if (!houses) {
      return res.status(404).json({ message: "No houses found" });
    }

    res.status(200).json(houses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const leaveHouse = async (req: Request, res: Response) => {
  try {
    const { houseCode, userId } = req.body;
    // Find the house with the provided code
    const house = await House.findOne({ code: houseCode });

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // Remove the user from house

    const user = await User.findById(userId);

    if (user) {
      // Check if the user is not already in the house
      if (user.houseCodes.includes(houseCode)) {
        //remove the house code from user's houseCodes array
        user.houseCodes = user.houseCodes.filter((code) => code !== houseCode);

        await user.save();

        //remove the user from the house's users array, direct assigning not working
        house.users = house.users.filter(
          (id) => id.toString() !== user._id.toString()
        );

        //remove the userName from the house's userNames array
        house.userNames = house.userNames.filter
          ((name) => name !== user.username );

        await house.save();
        res.status(200).json({ message: "Left house successfully" });
      } else {
        res.status(400).json({ message: "User is not in the house" });
      }
    } else {
      res.status(401).json({
        message: "You are not registered with us... who the fuck are you!!!",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
