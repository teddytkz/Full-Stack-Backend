const userModel = require('../model/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

exports.postFiles = async function (req, res) {

    const id = req.body.id
    const username = req.body.username
    const name = req.body.name
    const email = req.body.email
    let fs = require('fs')
    let random = (Math.random() + 1).toString(36).substring(2)
    console.log(random)
    try {
        fs.mkdir('./data/' + id + '/', {
            recursive: true
        }, function (err) {
            if (err) return cb(err);
            let filebase = './data/' + id + '/' + random + '.yml'
            fs.writeFile(filebase, 'Email : ' + email + '\nNama : ' + name, function (err) {
                if (err) throw err;
                console.log('File is created successfully.');
                userModel.updateOne({
                    _id: id
                }, {
                    $push: {
                        files: { location: filebase }
                    }
                })
                    .then(data => console.log("Add Files Location Success"))
                    .catch(err => console.log(err, "error"))
            });
        });
        res.json(new Array({
            status: "OK"
        }))
    } catch (error) {
        console.log(error)
    }
}

exports.getFiles = async function (req, res) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    const decode = jwt.decode(token)
    try {
        const users = await userModel.findOne({
            _id: decode.userId
        })
        // res.json(users);
        let result = [];
        users.files.forEach(element => {
            result.push({
                location: element['location']
            })
        });
        res.json(result)
    } catch (error) {
        console.log(error)
    }
}

exports.getUsers = async function (req, res) {
    try {
        const users = await userModel.find()
        // res.json(users);
        let result = [];
        users.forEach(element => {
            result.push({
                user: element['username']
            })
        });
        res.json(result)
    } catch (err) {
        console.log({
            message: err
        })
    }
}

exports.postRegister = async function (req, res) {
    const {
        username,
        password,
        name,
        email,
        country
    } = req.body
    try {
        let fs = require('fs')
        let result = []
        const salt = await bcrypt.genSalt()
        const hashPassword = await bcrypt.hash(password, salt)
        const user = new userModel({
            username: username,
            password: hashPassword,
            name: name,
            email: email,
            country: country
        })
        user.save()
            .then(
                data => {
                    result.push({
                        status: "Berhasil Register",
                        username: data['username']
                    })
                    res.json(result)
                    fs.mkdir('./data/' + data['id'] + '/', {
                        recursive: true
                    }, function (err) {
                        if (err) return cb(err);
                        let filebase = './data/' + data['id'] + '/file.yml'
                        fs.writeFile(filebase, 'Email : ' + data['email'] + '\nNama : ' + data['name'], function (err) {
                            if (err) throw err;
                            console.log('File is created successfully.');
                            update_files(data['id'], filebase)
                        });
                    });
                }
            )
            .catch(err => {
                console.log(err, "Failed Save Data");
                res.json(new Array({
                    status: "Error"
                }))
            })
    } catch (error) {
        console.log(error, "Failed Save Data");
        res.json(new Array({
            status: "Error"
        }))
    }
}

function update_files(id, filebase) {
    userModel.updateOne({
        _id: id
    }, {
        $set: {
            files: { location: filebase }
        }
    })
        .then(data => console.log("Update Files Location Success"))
        .catch(err => console.log(err, "error"))
}

exports.postLogin = async function (req, res) {
    try {
        const users = await userModel.findOne({
            username: req.body.username
        })
        const matchPass = await bcrypt.compare(req.body.password, users.password)
        if (!matchPass) {
            return res.status(404).json({
                msg: "Password Tidak Cocok"
            })
        }
        const userId = users._id
        const name = users.name
        const email = users.email

        const accessToken = jwt.sign({
            userId,
            name,
            email
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '20s'
        })

        const refreshToken = jwt.sign({
            userId,
            name,
            email
        }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: '1d',
        })

        userModel.updateOne({
            _id: userId
        }, {
            $set: {
                refreshToken: refreshToken
            }
        })
            .then(data => console.log("Update Token Success"))
            .catch(err => console.log(err, "error"))

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            // secure: true
        })

        res.json({
            accessToken
        })
    } catch (error) {
        res.status(404).json({
            msg: "Username Tidak Ditemukan"
        })
    }
}

exports.getLogout = async function (req, res) {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) return res.sendStatus(204)
    const users = await userModel.findOne({
        refreshToken: refreshToken
    })
    if (!users) return res.sendStatus(204)
    const userId = users._id
    await userModel.updateOne({
        _id: userId
    }, {
        refreshToken: null
    })
    res.clearCookie('refreshToken')
    return res.sendStatus(200)
}