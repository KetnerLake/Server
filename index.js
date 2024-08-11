const cors = require( 'cors' );
const express = require( 'express' );
const fs = require( 'fs' );
const jsonfile = require( 'jsonfile' );
const mysql = require( 'mysql2/promise' );
const parser = require( 'body-parser' );

// Configuration
const config = jsonfile.readFileSync( __dirname + '/config.json' );

// Database
let db = null;
mysql.createConnection( {
  host: config.database.host,
  user: config.database.username,
  password: config.database.password,
  port: config.database.port,
  database: config.database.target,
  ssl: {
    ca: fs.readFileSync( __dirname + config.database.certificate )
  }
} )
.then( ( conn ) => db = conn );

// Application
const app = express();

// Cross-domain
app.use( cors() );

// Middleware
app.use( parser.json( { limit: '50mb' } ) );
app.use( parser.urlencoded( {
  limit: '50mb',
  extended: false,
  parameterLimit: 50000
} ) );

// Per-request actions
app.use( async ( req, res, next ) => {
  // Pass along other variables
  req.config = config;
  req.db = db;

  // Just keep swimming!
  next();
} );

// Static files
app.use( '/', express.static( 'public' ) );

// Routes
app.use( '/v1/account', require( './routes/account' ) );
app.use( '/v1/calendar', require( './routes/calendar' ) );
app.use( '/v1/event', require( './routes/event' ) );

const port = process.env.PORT || config.server.port;

// Start
app.listen( port, () => {
  console.log( `Have an awesome year!` );
} );
