const bcrypt = require( 'bcryptjs' );
const express = require( 'express' );
const jwt = require( 'jwt-simple' );
const {v4: uuidv4} = require( 'uuid' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {id: 'Account', version: '2024-08-09'} );
} );

// Login
router.post( '/login', async ( req, res ) => {
  const [results] = await req.db.query(
    `SELECT 
      id, 
      uuid, 
      email, 
      password 
    FROM 
      Account 
    WHERE 
      email = ?`,
    [req.body.email]
  );    

  if( results.length === 0 ) {
    // Email not found
    res.json( null );
  } else {
    if( bcrypt.compareSync( req.body.password, results[0].password ) ) {
      const expiration = new Date();
      expiration.setDate( expiration.getDate() + 30 );
  
      const session = {
        email: req.body.email,
        issuer: 'ketnerlake-api',
        uuid: results[0].uuid,
        expires: expiration.getTime()
      };
  
      res.json( jwt.encode( session, req.config.jwt ) );
    } else {
      // Password does not match
      res.json( null );
    }
  }
} );

// Register
router.post( '/register', async ( req, res ) => {
  const [accounts] = await req.db.query(
    `SELECT 
      id, 
      uuid, 
      email, 
      password 
    FROM 
      Account 
    WHERE 
      email = ?`,
    [req.body.email]
  );    

  if( accounts.length === 0 ) {
    const uuid = uuidv4();

    const salt = bcrypt.genSaltSync( 10 );
    const password = bcrypt.hashSync( req.body.password, salt );   

    await req.db.query(
      `INSERT INTO Account ( 
        uuid, 
        email, 
        password
      ) VALUES ( ?, ? , ? )`,
      [uuid, req.body.email, password ]
    );   
    
    const expiration = new Date();
    expiration.setDate( expiration.getDate() + 30 );

    const session = {
      email: req.body.email,
      issuer: 'ketnerlake-api',
      uuid: uuid,
      expires: expiration.getTime()
    };

    res.json( jwt.encode( session, req.config.jwt ) );
  } else {
    res.json( null );
  }
} );

// Export
module.exports = router;
