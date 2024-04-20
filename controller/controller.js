const { pool } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {Orders, Visitors,  Analytics, Ip_address, Users, File} = require("../models");
const sequelize = require('sequelize')
const whatsapp = require("whatsapp-chat-parser");
const fs = require("fs");
const path = require("path");
const Op = require("sequelize").Op;
const decompress = require("decompress");
const { mail } = require("../utils/mailer");

// const axios = require("axios");
// const fileupload = require("express-fileupload");

const signup = async (req, res) => {
    const { name, email, password, cpassword, user_type } = req.body;
    if (!name || !email || !password || !cpassword || !user_type) {
        return res
            .status(422)
            .json({ message: "please fill the required fields" });
    }
    else if (password !== cpassword){
        return res.status(421).json({ error: "password is not matching" });
    }
    try {
        const response = await Users.findOne({ 
            where: { email } 
        })
        if (response !== null){
            return res
                .status(400)
                .json({ error: "Email already register try another." });
        }
        const hashedSignupPassword = await bcrypt.hash(password, 10);
        await Users.create({
            name,
            email,
            password : hashedSignupPassword,
            user_type
        })
        res.status(200).json({ message: "User registered sucessfully" });
        
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res
            .status(422)
            .json({ message: "please fill the required fields" });
    }
    try {
        const response = await Users.findOne({
            where :{ email }
        })
        // console.log( data.rows)
        if (response === null) {
            res.status(400).json({
                error: "User is not registered, Sign Up first",
            });
        } else {
            const verifiedUser = await bcrypt.compare(password, response.password)
            console.log(verifiedUser)
            if (verifiedUser) {
                //Checking if credentials match
                const token = jwt.sign(
                    {
                        email: email,
                        user_type: response.user_type,
                    },
                    process.env.SECRET_KEY
                );
                res.status(200).json({
                    message: "User signed in!",
                    token: token,
                });
            } else {
                res.status(400).json({
                    error: "Enter correct password!",
                });
            }
        }
    } catch (err) {
        res.status(500).json({
            error: "Database error occurred while signing in!", //Database connection error
        });
    }
};

const singleFile = async (req, res) => {
    const file = req.file;
    console.log(file);
    if (!req.file) {
        res.status(400).json({
            status: "failed",
            message: "file is missing",
        });
    } else {
        try {
            res.status(200).json({
                status: "sucess",
                message: "file uploaded sucessfully",
            });
        } catch (error) {
            res.status(400).json({
                status: "failed",
                message: "error",
            });
        }
    }
};

const singleFile2 = async (req, res) => {
    console.log(req.file);
    if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
    }
    try {
        // Save file path and metadata to the database
        const file = await File.create({
            filename: req.file.originalname,
            filepath: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size,
        });

        res.json({
            message: `File uploaded and saved to database with ID: ${file.id}`,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error saving file" });
    }
};

const checkOutOrder = async (req, res) => {
    const {
        name,
        phone,
        address,
        city,
        pincode,
        email,
        payment_id,
        payment_method,
        from_ip,
        from_browser,
    } = req.body;
    try {
        var date = Date();
        const order = await Orders.create({
            name,
            phone,
            address,
            city,
            pincode,
            email,
            payment_id,
            payment_method,
            from_ip,
            from_browser,
            date,
        });
        return res.json({ msg: "Order Success", details: order });
    } catch (e) {
        //console.log(e);
        return res.status(500).json(e);
    }
};

const postTXT = async (req, res) => {
    const file = req.files.file;
    const result = await analytics.findOne({
        where: { id: 1 },
        raw: true,
    });
    console.log(result.txt_count);
    const result_update = await analytics.update(
        { txt_count: result.txt_count + 1 },
        { where: { id: 1 } }
    );
    // Timestamp for renaming the file
    var renamed = new Date().getTime() + ".txt";
    // Moving File to myuploads folder
    file.mv(path.join(__dirname, "./myuploads/" + renamed), (err) => {
        if (err) {
            // console.log(err);
            return res.json({ msg: err });
        }
        // readFile function to parse and send txtn as response
        // readFile(req, res, renamed);
        const fileContents = fs.readFileSync(
            path.join(__dirname, "./myuploads/" + renamed),
            "utf8"
        );
        whatsapp
            .parseString(fileContents)
            .then((messages) => {
                // delete files
                fs.unlink(
                    path.join(__dirname, "./myuploads/" + renamed),
                    function (err) {
                        if (err) console.log("err", err);
                    }
                );
                return res.send(messages);
                // Do whatever you want with messages
            })
            .catch((err) => {
                return res.send(err);
                // Something went wrong
            });
    });
};

const zip = async (req, res) => {
    try {
        const result = await analytics.findOne({
            where: { id: 1 },
            raw: true,
        });
        console.log(result.zip_count);
        const result_update = await analytics.update(
            { zip_count: result.zip_count + 1 },
            { where: { id: 1 } }
        );

        const target = path.join(__dirname, "./myuploads");
        const file = req.files.file;
        var renamed = new Date().getTime() + ".zip";
        file.mv(path.join(__dirname, "./myuploads/" + renamed), (err) => {
            if (err) {
                // console.log(err);
                return res.json({ msg: err });
            }
            unzipFiles(req, res, renamed);
        });
        //return res.json({"msg":"ok"});
    } catch (e) {
        console.log("err", e);
        res.status(500).json(e);
    }
};

const ip = async (req, res) => {
    try {
        const ip = req.body.ip;
        const ip_res = await ip_address.findOne({
            where: { ip },
            raw: true,
        });
        console.log(ip_res);
        if (ip_res != null) {
            return res.json({ status: "success", msg: "Already exist" });
        }
        const ip_cre = await ip_address.create({
            name: "user",
            ip,
        });
        const result = await analytics.findOne({
            where: { id: 1 },
            raw: true,
        });
        console.log(result.user_count);
        const result_update = await analytics.update(
            { user_count: result.user_count + 1 },
            { where: { id: 1 } }
        );
        return res.json({ status: "success", msg: "Added Successfully!" });
    } catch (e) {
        console.log(e);
        return res.json(e);
    }
};

const visitors = async (req, res) => {
    const { name, email, phone, msg } = req.body;
    try {
        const visitor = await Visitors.findOne({ where: { email, phone } });
        if (visitor) {
            return res.json({ msg: "Email & Phone Numnber already Exist!" });
        }
        const order = await Visitors.create({
            name,
            email,
            phone,
            msg,
        });

        const mailSent = await mail(name, email, phone, msg);
        return res.json({ Status: "success" });
    } catch (e) {
        console.log(e);
        return res.status(500).json(e);
    }
};

const orderId = async (req, res) => {
    const order_id = req.params.order_id;
    const { status, capture_status, payment_id } = req.body;
    try {
        const order_update = await Orders.update(
            { status, capture_status, payment_id },
            { where: { order_id } }
        );
        return res.json({ msg: "Success", details: order_update });
    } catch (e) {
        //console.log(e);
        return res.status(500).json(e);
    }
};

const fetchOrderId = async (req, res) => {
    const order_id = req.params.order_id;
    try {
        const order = await Orders.findOne({
            where: { order_id },
        });
        return res.json(order);
    } catch (e) {
        return res.status(500).json(e);
    }
};

const fetchOrders = async (req, res) => {
    try {
        const orders = await Orders.findAll();
        return res.json(orders);
    } catch (e) {
        return res.status(500).json(e);
    }
};

const stats = async (req, res) => {
    try {
        const orders = await Orders.findAll();
        const visitors = await Visitors.findAll();
        const users_counts = await analytics.findOne({
            where: { id: 1 },
            raw: true,
        });
        var yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        var today = new Date();
        // Get last 24 hrs record
        const last_24_hrs = await Orders.findAll({
            where: {
                date: {
                    [Op.between]: [yesterday, today],
                },
            },
        });
        var total_users =
            orders.length + visitors.length + users_counts.user_count;
        // var total_orders_per_day = last_24_hrs.length;
        // var total_orders = orders.length;
        var total_analyzed = users_counts.txt_count + users_counts.zip_count;
        var total_analyzed_per_day = last_24_hrs.length;
        // console.log(total_users)
        // console.log(total_orders_per_day)
        // console.log(total_orders)
        // Set default values
        if (total_users < 150) total_users = 150;
        if (total_analyzed_per_day < 10) total_analyzed_per_day = 15;
        if (total_analyzed < 90) total_analyzed = 100;
        console.log(total_analyzed);
        return res.json({
            Total_Users: total_users,
            total_analyzed_per_day: total_analyzed_per_day,
            total_analyzed: total_analyzed,
        });
    } catch (e) {
        console.log(e);
        return res.json(e);
    }
};

const statsLogin = async (req, res) => {
    try {
        const orders = await Orders.findAll();
        const visitors = await Visitors.findAll();
        const users_counts = await analytics.findOne({
            where: { id: 1 },
            raw: true,
        });
        var yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        var today = new Date();
        // Get last 24 hrs record
        const last_24_hrs = await Orders.findAll({
            where: {
                date: {
                    [Op.between]: [yesterday, today],
                },
            },
        });
        var total_users =
            orders.length + visitors.length + users_counts.user_count;
        // var total_orders_per_day = last_24_hrs.length;
        // var total_orders = orders.length;
        var total_analyzed = users_counts.txt_count + users_counts.zip_count;
        var total_analyzed_per_day = last_24_hrs.length;
        // console.log(total_users)
        // console.log(total_orders_per_day)
        // console.log(total_orders)
        // Set default values
        if (total_users < 150) total_users = 150;
        if (total_analyzed_per_day < 10) total_analyzed_per_day = 15;
        if (total_analyzed < 90) total_analyzed = 100;
        console.log(total_analyzed);
        return res.json({
            Total_Users: total_users,
            total_analyzed_per_day: total_analyzed_per_day,
            total_analyzed: total_analyzed,
        });
    } catch (e) {
        console.log(e);
        return res.json(e);
    }
};

async function unzipFiles(req, res, renamed) {
    // Unzip file into myuploads folder
    var file_name;
    const f = await decompress(
        path.join(__dirname, "./myuploads/" + renamed),
        path.join(__dirname, "./myuploads/")
    ).then((files) => {
        file_name = files[0].path;
    });
    // Delete the zip folder after extracting files

    fs.unlink(path.join(__dirname, "./myuploads/" + renamed), function (err) {
        if (err) console.log(err);
    });
    console.log(renamed);
    console.log(file_name);
    const fileContentss = fs.readFileSync(
        path.join(__dirname, "./myuploads/" + file_name),
        "utf8"
    );

    whatsapp.parseString(fileContentss).then((messages) => {
        // delete file
        fs.unlink(
            path.join(__dirname, "./myuploads/" + file_name),
            function (err) {
                if (err) console.log("err", err);
            }
        );
        return res.send(messages);
        // Do whatever you want with messages
    });
    // return res.json("ok");
}

module.exports = {signup, login, checkOutOrder, singleFile, singleFile2, orderId, fetchOrders, fetchOrderId, visitors, postTXT, zip, ip, stats, statsLogin};
