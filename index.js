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

  // Check header
  // Authentication
  if( req.headers['x-anno-awesome'] ) {
    // Query for account
    const [results, fields] = await req.db.query(
      'SELECT id, token FROM Account WHERE token = ?',
      [req.headers['x-anno-awesome']]
    );

    if( results.length === 0 ) {
      // Not found
      // Pass along nothing
      req.accountId = null;
    } else {
      // Pass along the account record
      req.accountId = results[0].id;
    }
  } else {
    req.accountId = null;
  }

  // Just keep swimming!
  next();
} );

// Static files
app.use( '/', express.static( 'public' ) );

// Routes
app.use( '/api/v1/event', require( './routes/event' ) );

// Start
app.listen( 3000, () => {
  console.log( `Have an awesome year!` );
} );
