const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const mime = require('mime-types');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 4000;
const jwtSecret = process.env.JWT_SECRET || 'default_secret'; // Using environment variable or default

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Create the uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Set up static file serving for the uploads directory
app.use('/uploads', express.static(__dirname+'/uploads'));


// Database connection
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB database');
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.userData = decoded;
    next();
  });
};

// Registration route
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ name, email, password: hashedPassword });
    res.json(user);
  } catch (error) {
    res.status(422).json({ message: 'Registration failed', error });
  }
});




function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

// Login route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: 'Incorrect password' });
  }
  const token = jwt.sign({ userId: user._id }, jwtSecret);
  res.cookie('token', token, { httpOnly: true }).json({ message: 'Login successful' });
});

// Logout route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token').json({ message: 'Logout successful' });
});

// Profile route
app.get('/api/profile', verifyToken, async (req, res) => {
  const user = await User.findById(req.userData.userId).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
});

// Place creation route
// app.post('/api/places', verifyToken, async (req, res) => {
//   const { title, description, price } = req.body;
//   const userId = req.userData.userId;
//   try {
//     const place = await Place.create({ title, description, price, owner: userId });
//     res.json(place);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create place', error });
//   }
// });




app.post('/api/places', verifyToken,async (req,res) => {
  
  const {token} = req.cookies;
  const userId = req.userData.userId;

  console.log(userId)
  const {
    title,address,addedPhotos,description,price,
    perks,extraInfo,checkIn,checkOut,maxGuests,
  } = req.body;
 
    
    const placeDoc = await Place.create({
      owner:userId,price,
      title,address,photos:addedPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,
    })
    res.json(placeDoc);
    
});



// app.put('/api/places', async (req,res) => {
  
//   const {token} = req.cookies;
//   const {
//     id, title,address,addedPhotos,description,
//     perks,extraInfo,checkIn,checkOut,maxGuests,price,
//   } = req.body;



//   jwt.verify(token, jwtSecret, {}, async (err, userData) => {
//     if (err) throw err;
//     const placeDoc = await Place.findById(id);
//     console.log(userData.id,placeDoc.owner)
//     if (userData.id.toString() === placeDoc.owner.toString()) {
//       placeDoc.set({
//         title,address,photos:addedPhotos,description,
//         perks,extraInfo,checkIn,checkOut,maxGuests,price,
//       });
//       await placeDoc.save();
//       res.json('ok');
//     }
//   });
// });


app.get('/api/places', async (req,res) => {
  
  res.json( await Place.find() );
});



// app.put('/api/places', async (req, res) => {
//   try {
//     const { token } = req.cookies;
//     const {
//       id,
//       title,
//       address,
//       addedPhotos,
//       description,
//       perks,
//       extraInfo,
//       checkIn,
//       checkOut,
//       maxGuests,
//       price,
//     } = req.body;

//     // Verify token
//     // const userData = await verifyToken(req);

//     // // Find the place document
//     const placeDoc = await Place.findById(id);

//     // console.log(userData,placeDoc.owner.toString())

//     // Check if the user is the owner of the place
//     // if (userData.id.toString() !== placeDoc.owner.toString()) {
//     //   throw new Error('Unauthorized: You are not the owner of this place');
//     // }

//     // Update the place document
//     placeDoc.set({
//       title,
//       address,
//       photos: addedPhotos,
//       description,
//       perks,
//       extraInfo,
//       checkIn,
//       checkOut,
//       maxGuests,
//       price,
//     });

//     // Save the updated place document
//     await placeDoc.save();

//     res.json('ok');
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });




app.put('/api/places', verifyToken, async (req, res) => {
  try {
    const { token } = req.cookies;
    const {
      id,
      title,
      address,
      addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    } = req.body;
    console.log(addedPhotos)

    const userId = req.userData.userId;

    console.log(userId)

    // Find the place document
    const placeDoc = await Place.findById(id);

    console.log(placeDoc)

    // Check if the user is the owner of the place
    if (userId !== placeDoc.owner.toString()) {
      throw new Error('Unauthorized: You are not the owner of this place');
    }

    // Update the place document
    placeDoc.set({
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });

    // Save the updated place document
    await placeDoc.save();

    res.json('ok');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});













// // Booking creation route
// app.post('/api/bookings', verifyToken, async (req, res) => {
//   const { placeId, startDate, endDate } = req.body;
//   const userId = req.userData.userId;
//   try {
//     const booking = await Booking.create({ place: placeId, guest: userId, startDate, endDate });
//     res.json(booking);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create booking', error });
//   }
// });



// app.post('/api/bookings',verifyToken,async (req, res) => {
//   const {token} = req.cookies
//   const userId = req.userData.userId;
//   console.log(userId)
  
  
//   const {
//     place,checkIn,checkOut,numberOfGuests,name,phone,price,
//   } = req.body;
//   Booking.create({
//     place,checkIn,checkOut,numberOfGuests,name,phone,price,
//     user:userId,
//   }).then((doc) => {
//     res.json(doc);
//   }).catch((err) => {
//     throw err;
//   });
// });


app.get('/api/bookings',verifyToken, async (req, res) => {
  const userId = req.userData.userId;
  console.log(userId)
  try {
    // Retrieve bookings for the user
    const bookings = await Booking.find({ user: userId }).populate('place');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error });
  }
});

// GET route to retrieve a specific booking by ID
app.get('/api/bookings/:id', verifyToken, async (req, res) => {
  const userId = req.userData.userId;
  const bookingId = req.params.id;

  try {
    // Retrieve the booking by ID for the user
    const booking = await Booking.findOne({ _id: bookingId, user: userId }).populate('place');
    
    // Check if the booking exists
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booking', error });
  }
});






app.post('/api/bookings', verifyToken,async (req, res) => {
  const userId = req.userData.userId;
  const {
    place, checkIn, checkOut, numberOfGuests, name, phone, price,
  } = req.body;

  // Check if all required fields are present
  if (!place || !checkIn || !checkOut || !numberOfGuests || !name || !phone || !price) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  try {
    const booking = await Booking.create({
      place, checkIn, checkOut, numberOfGuests, name, phone, price, user: userId,
    });
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create booking', error });
  }
});




// User's places route
app.get('/api/user-places', verifyToken, async (req, res) => {
  const userId = req.userData.userId;
  try {
    const places = await Place.find({ owner: userId });
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user places', error });
  }
});

// Upload by link route
// app.post('/api/upload-by-link', async (req, res) => {
//   const { link } = req.body;
//   console.log(link)
//   const newName = 'photo' + Date.now() + '.jpg';
//   console.log(newName)
//   await imageDownloader.image({
//     url: link,
//     dest:  __dirname + '/uploads/' +newName,
//   });
//   res.json(newName);
// });


app.post('/api/upload-by-link', async (req, res) => {
  const { link } = req.body;

  // Check if the link is provided
  if (!link) {
    return res.status(400).json({ error: 'The link parameter is required' });
  }

  try {
    // Download the image from the provided URL
    const newName = 'photo' + Date.now() + '.jpg';
    await imageDownloader.image({
      url: link,
      dest: __dirname + '/uploads/' + newName,
    });
    res.json(newName);
  } catch (error) {
    console.error('Error downloading image:', error);
    res.status(500).json({ error: 'Failed to download image from the provided URL' });
  }
});





// Upload route
const photosMiddleware = multer({ dest: 'uploads/' });
app.post('/api/upload', photosMiddleware.array('photos', 100), async (req, res) => {
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname, mimetype } = req.files[i];
    const parts = originalname.split('.');
    const ext = parts[parts.length-1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
    uploadedFiles.push(newPath.replace('uploads/', ''));
  }
  res.json(uploadedFiles);
});

app.get('/api/places/:id', async (req,res) => {
  
  const {id} = req.params;
  res.json(await Place.findById(id));
});



// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});