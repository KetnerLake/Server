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
      'SELECT id FROM Account WHERE uuid = ?',
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
  res.json( {id: 'Event', version: '2024-08-08'} );
} );

// Read all records
router.get( '/', async ( req, res ) => {
  const [events] = await req.db.query(
    `SELECT 
      Event.uuid AS id, 
      Calendar.uuid AS calendarId, 
      Event.createdAt, 
      Event.updatedAt, 
      startsAt, 
      endsAt, 
      summary, 
      location, 
      latitude, 
      longitude, 
      url, 
      description 
    FROM 
      Calendar, 
      Event 
    WHERE 
      Event.calendarId = Calendar.id AND 
      Calendar.isActive = 1 AND 
      Calendar.accountId = ?`,
    [req.account.id]
  );  

  for( let e = 0; e < events.length; e++ ) {
    events[e].startsAt = events[e].startsAt.toISOString().substring( 0, 10 );
    events[e].endsAt = events[e].endsAt.toISOString().substring( 0, 10 );
  }

  res.json( events.length > 0 ? events : null );
} );

// Read all records for given year
router.get( '/year/:year', async ( req, res ) => {
  const start = new Date( req.params.year, 0, 1 );
  const end = new Date( req.params.year, 11, 31 );
  
  const [events] = await req.db.query(
    `SELECT 
      Event.uuid AS id, 
      Event.createdAt, 
      Event.updatedAt, 
      Calendar.uuid AS calendarId, 
      startsAt, 
      endsAt, 
      summary, 
      location, 
      latitude,
      longitude,
      url, 
      description 
    FROM 
      Calendar, 
      Event 
    WHERE 
      Calendar.id = Event.calendarId AND 
      Calendar.accountId = ? AND 
      Calendar.isActive = 1 AND 
      Event.startsAt >= ? AND Event.endsAt <= ?`,
    [req.account.id, start, end]
  );  

  for( let e = 0; e < events.length; e++ ) {
    events[e].startsAt = events[e].startsAt.toISOString().substring( 0, 10 );
    events[e].endsAt = events[e].endsAt.toISOString().substring( 0, 10 );
  }

  res.json( events.length > 0 ? events : null );    
} );

// Read single record for given ID
router.get( '/:id', async ( req, res ) => {
  const [events] = await req.db.query(
    `SELECT 
      Event.uuid AS id, 
      Calendar.uuid AS calendarId, 
      Event.createdAt, 
      Event.updatedAt, 
      startsAt, 
      endsAt, 
      summary, 
      location, 
      latitude, 
      longitude, 
      url, 
      description 
    FROM 
      Calendar, 
      Event 
    WHERE 
      Event.calendarId = Calendar.id AND 
      Calendar.isActive = 1 AND 
      Calendar.accountId = ? AND 
      Event.uuid = ?`,
    [req.account.id, req.params.id]
  );  

  events[0].startsAt = events[0].startsAt.toISOString().substring( 0, 10 );
  events[0].endsAt = events[0].endsAt.toISOString().substring( 0, 10 );

  res.json( events.length > 0 ? events[0] : null );
} );

// Create a new record
router.post( '/:id', async ( req, res ) => {
  const [calendars] = await req.db.query(
    `SELECT 
      id 
    FROM 
      Calendar 
    WHERE 
      uuid = ?`,
    [req.body.calendarId]
  );  

  await req.db.query(
    `INSERT INTO Event ( 
      uuid, 
      createdAt,
      updatedAt,
      calendarId, 
      startsAt, 
      endsAt, 
      summary, 
      location, 
      latitude,
      longitude,
      url,
      description ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? )`, [
      req.body.id,
      new Date( req.body.createdAt ),
      new Date( req.body.updatedAt ),
      calendars[0].id,       
      req.body.startsAt, 
      req.body.endsAt, 
      req.body.summary, 
      req.body.location, 
      req.body.latitude,
      req.body.longitude,              
      req.body.url, 
      req.body.description
    ] 
  );    

  res.json( req.body );
} );

// Update an existing record
router.put( '/:id', async ( req, res ) => {
  const [calendars] = await req.db.query(
    `SELECT 
      id 
    FROM 
      Calendar 
    WHERE 
      uuid = ?`,
    [req.body.calendarId]
  );

  await req.db.query(
    `UPDATE 
      Event 
    SET 
      uuid = ?, 
      updatedAt = ?,
      calendarId = ?,       
      startsAt = ?, 
      endsAt = ?, 
      summary = ?, 
      location = ?,
      latitude = ?,
      longitude = ?,
      url = ?, 
      description = ? 
    WHERE 
      uuid = ? AND 
      calendarId = ?`, [
        req.body.id, 
        new Date( req.body.updatedAt ), 
        calendars[0].id,
        req.body.startsAt, 
        req.body.endsAt, 
        req.body.summary, 
        req.body.location, 
        req.body.latitude,
        req.body.longitude,
        req.body.url, 
        req.body.description, 
        req.body.id, 
        calendars[0].id
    ] 
  );

  res.json( req.body );
} );

// Delete a record for a given account
router.delete( '/:id', async ( req, res ) => {
  await req.db.query(
    `DELETE FROM 
      Event 
    WHERE 
      uuid = ?`, [
      req.params.id, 
    ] 
  );

  res.json( {
    id: req.params.id
  } );
} );

// Export
module.exports = router;
