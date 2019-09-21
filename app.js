//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));



//**Database Info Using Mongo/Mongoose** //
// Creation of mongodb connection
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Creation of Mongoose items schema
const itemsSchema = ({
  name: String
});

// Creation of a Mongoose model
const Item = mongoose.model("Item", itemsSchema);

// Create Mongoose documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// Add Mongoose documents to an array
const defaultItems = [item1, item2, item3];



// New listSchema to create custom lists
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// New model utilizing the listScheme
const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

  // Finding the documents from the todolistDB and rendering it to app
  // NOTE: Good reference materia to render default information from a Mongo/Mongoose database
  Item.find({}, function(err, foundItems) {

    // Logic below adds default items for database if empty, then redirects to render the list.ejs page
    if (foundItems.length === 0) {

      //Add the documents to the todolistDB with the insertMany() function
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully added all the default items to DB.");
        }
      });
      res.redirect("/");
      // Render list.ejs template with title and accumulated list items
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

app.post("/", function(req, res) {
  //** Add a new item to the datebase **//
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // New item is created with associating name property
  // of Datebase and the list.ejs input element
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    // New item is saved to database with method then redirected to home page for Today list
    item.save();
    res.redirect("/");
  } else {
    // New item is added for a created list, saved, and redirected to custom route parameter
    List.findOne({name: listName}, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});



app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;

  Item.findByIdAndRemove(checkedItemId, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully removed document by id.");
      res.redirect("/");
    }
  });
});



app.get("/:customListName", function(req, res) {
  // Constant created for route parameter
  const customListName = req.params.customListName;

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {

      if (!foundList) {
        // List model created from base default items upon no error not being found
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        // List is saved then redirected to /:customListName
        list.save();
        res.redirect("/" + customListName);

      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});



app.get("/about", function(req, res) {
  res.render("about");
});



app.listen(3000, function() {
  console.log("Server started on port 3000");
});
