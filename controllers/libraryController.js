const twilio = require("twilio");
const Library = require("../models/libraryModel.js");
const User = require("../models/userModel.js");
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID);
const fromTwilio=process.env.fromTwilio;
// GET
// library homepage
exports.getLibrary = function (req, res) {
    User.findOne({ _id: req.params.userID }, function (err, foundUser) {
        if (err) {
            res.send(err);
        } else {
            if (foundUser.signedIn == false) {
                res.render("login", { dangerMessage: "Please Sign In before accessing the library." })
            } else {
                Library.find({}, function (err, foundBooks) {
                    if (err) {
                        res.send(err);
                    } else {
                        res.render("library", {
                            user: foundUser,
                            books: foundBooks.reverse()//display newly added books first
                        });
                        const currtemp=Date.now();
                        const currentDate= currtemp;
                        
                        // foundBooks.forEach(async function (object) {
                        //     if (object.dueDate <= currentDate) {
                        //        console.log("Hi");
                        //     }
                        // });
                        let i=0;
                        for(i;i<foundUser.issuedBooks.length;i++){
                            Library.findOne({ bookName: foundUser.issuedBooks[i].bookName }, async function (err, foundBook) {
                                if (err) {
                                    res.send(err);
                                } else {
                                    let messageContact="+91"+String(foundUser.contact);
                                    if(foundBook.dueDate<=currentDate){
                                        console.log("Hi");
                                        client.messages.create({
                                            from:fromTwilio,
                                            to: messageContact,
                                            body:'Your book is due'
                                        })
                                        .then((res)=>(console.log("Message is sent")))
                                        .catch((e)=>console.log(e));
                                       
                                    }else{
                                        let messageContact="+91"+String(foundUser.contact);
                                        client.messages.create({
                                            
                                            from:fromTwilio,
                                            to: messageContact,
                                            body:`Your book is due`
                                        })
                                        .then((res)=>(console.log("Message is sent")))
                                        .catch((e)=>console.log(e));
                                    }
                                }
                            });
                        }
                    
                    }
                });
            }
        }
    });
}

// POST
// sign out from the library
exports.postSignout = function (req, res) {
    User.findOne({ _id: req.params.userID }, async function (err, foundUser) {
        if (err) {
            res.send(err);
        } else {
            foundUser.signedIn = false;
            await foundUser.save();
            res.redirect("/");
        }
    });
}

// POST
// issue a book from the library
exports.postIssueBook = function (req, res) {
    User.findOne({ _id: req.params.userID }, async function (err, foundUser) {
        if (err) {
            res.send(err);
        } else {
            var hasBook = false;
            foundUser.issuedBooks.forEach(async function (object) {
                // console.log(object.bookName + " :: " + req.body.bookName);
                if (object.bookName === req.body.bookName) {
                    hasBook = true;
                }
            });
            if (!hasBook) {
                // adding selected book to the user collection
                foundUser.issuedBooks.push({
                    bookName: req.body.bookName
                });
                await foundUser.save();
                // user issues the new book
                // updating available and issued books in library collection
                Library.findOne({ bookName: req.body.bookName }, async function (error, libraryBook) {
                    if (error) {
                        res.send(err);
                    } else {
                        const dtemp=Date.now();
                        const d2 = dtemp;
                        // program to convert date to number

                        // converting to number
                        const due = d2 + 604800000;//one week due time
                        libraryBook.dueDate=due;
                        // console.log(libraryBook);
                        libraryBook.available = libraryBook.available - 1;
                        libraryBook.issued = libraryBook.issued + 1;
                        await libraryBook.save();
                        res.redirect("/library/" + req.params.userID);
                    }
                });
            } else {
                // user already issued the book
                res.redirect("/library/" + req.params.userID);
            }
        }
    });
}

// POST
// return books to the library
exports.postReturnBook = function (req, res) {
    User.findOne({ _id: req.params.userID }, function (err, foundUser) {
        if (err) {
            res.send(err);
        } else {
            // removing book from issuedBooks array of users collection
            foundUser.issuedBooks.forEach(async function (object, index) {
                if (object.bookName == req.body.returnBookName) {
                    foundUser.issuedBooks.splice(index, 1);
                    await foundUser.save();
                }
            });
            // updating available and issued books in Library collection
            Library.findOne({ bookName: req.body.returnBookName }, async function (err, foundBook) {
                if (err) {
                    res.send(err);
                } else {
                    foundBook.issued = foundBook.issued - 1;
                    foundBook.available = foundBook.available + 1;
                    await foundBook.save();
                }
            });
            // redirecting to user's library
            res.redirect("/library/" + req.params.userID);
        }
    });
}

// GET
// add new books to the library
exports.getNewBook = async function (req, res) {
    User.findOne({ _id: req.params.userID }, function (err, foundUser) {
        if (err) {
            res.send(`Please login or register <a href="/">here</a> before accessing the library!`);
        } else {
            if (foundUser.signedIn == false) {
                res.render("login", { dangerMessage: "Please Sign In before adding a book to the library." })
            } else {
                res.render("newBook", { user: foundUser });
            }
        }
    });
}

// POST
// add new books to the library
exports.postNewBook = function (req, res) {
    Library.findOne({ bookName: req.body.newBookName }, async function (err, foundBook) {
        if (err) {
            res.send(err);
        } else {
            if (foundBook) {
                res.send(`Sorry, that book already exists in the library, please try with another book.`);
            } else {
                if (req.body.newBookCover) {
                    const newBook = new Library({
                        bookName: req.body.newBookName,
                        issued: 0,
                        available: 50,
                        total: 50,
                        cover: req.body.newBookCover,
                        rating: req.body.newBookRating
                    });
                    await newBook.save();
                } else {
                    const newBook = new Library({
                        bookName: req.body.newBookName,
                        issued: 0,
                        available: 50,
                        total: 50,
                        cover: "https://source.unsplash.com/random",
                        rating: req.body.newBookRating
                    });
                    await newBook.save();
                }
                res.redirect("/library/" + req.params.userID);
            }
        }
    });
}