const express = require( 'express' );
const jwt = require( 'jwt-simple' );

// Router
let router = express.Router();

// Authentication
router.use( '/', async ( req, res, next ) => {
  // Bypass for testing
  if( req.path === '/test' ) 
    next();

  let decoded = null;

  try {
    decoded = jwt.decode( req.headers['x-anno-awesome'], req.config.jwt );
  } catch( error ) {
    // Invalid token
    res.json( null );
    res.end();
  }

  if( decoded.issuer === 'ketnerlake-api' && Date.now() < decoded.expires ) {
    const [accounts] = await req.db.query(
      `SELECT 
        id 
      FROM 
        Account 
      WHERE 
        uuid = ?`,
      [decoded.uuid]
    );  
    req.account = accounts[0];

    next();
  } else {
    // Invalid signature
    res.json( null );
    res.end();
  }
} );

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {id: 'Calendar', version: '2024-08-10'} );
} );

// Read all records
router.get( '/', async ( req, res ) => {
  const [calendars] = await req.db.query(
    `SELECT 
      Calendar.uuid AS id, 
      Account.uuid AS accountId,
      Calendar.createdAt, 
      Calendar.updatedAt, 
      name,
      color,
      isShared,
      isPublic,
      isActive
    FROM 
      Account,
      Calendar
    WHERE 
      Calendar.accountId = Account.id AND 
      Calendar.accountId = ?`,
    [req.account.id]
  );  

  res.json( calendars.length > 0 ? calendars : null );
} );

// Read single record
router.get( '/:id', async ( req, res ) => {
  const [calendars] = await req.db.query(
    `SELECT 
      Calendar.uuid AS id, 
      Account.uuid AS accountId,
      Calendar.createdAt, 
      Calendar.updatedAt, 
      name,
      color,
      isShared,
      isPublic,
      isActive
    FROM 
      Account,
      Calendar
    WHERE 
      Calendar.accountId = Account.id AND 
      Calendar.accountId = ? AND
      Calendar.uuid = ?`,
    [req.account.id, req.params.id]
  );  

  res.json( calendars.length > 0 ? calendars[0] : null );
} );

// Create a new record
router.post( '/:id', async ( req, res ) => {
  await req.db.query(
    `INSERT INTO Calendar ( 
      uuid, 
      createdAt,
      updatedAt,
      accountId,
      name,
      color,
      isShared,
      isPublic,
      isActive
  ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ? )`, [
      req.body.id, 
      new Date( req.body.createdAt ),
      new Date( req.body.updatedAt ),
      req.account.id,
      req.body.name,
      req.body.color,
      req.body.isShared,
      req.body.isPublic,
      req.body.isActive
    ] 
  );

  res.json( req.body );
} );

// Update an existing record
router.put( '/:id', async ( req, res ) => {
  await req.db.query(
    `UPDATE 
      Calendar 
    SET 
      uuid = ?, 
      updatedAt = ?,
      name = ?,
      color = ?,
      isShared = ?,
      isPublic = ?,
      isActive = ?
    WHERE 
      uuid = ? AND 
      accountId = ?`, [
      req.body.id, 
      new Date( req.body.updatedAt ), 
      req.body.name, 
      req.body.color, 
      req.body.isShared, 
      req.body.isPublic, 
      req.body.isActive, 
      req.body.id, 
      req.account.id
    ] 
  );

  res.json( req.body );
} );

// Delete a record
router.delete( '/:id', async ( req, res ) => {
  await req.db.query(
    `DELETE FROM 
      Calendar
    WHERE 
      uuid = ? AND 
      accountId = ?`, [
      req.params.id, 
      req.account.id
    ] 
  );

  res.json( {
    id: req.params.id
  } );
} );

// Export
module.exports = router;
