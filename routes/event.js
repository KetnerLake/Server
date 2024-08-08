const express = require( 'express' );

// Router
let router = express.Router();

// Test
router.get( '/test', ( req, res ) => {    
  res.json( {event: 'Test'} );
} );

// Read all records for given account
router.get( '/', async ( req, res ) => {
  const [results, fields] = await req.db.query(
    'SELECT token AS id, createdAt, updatedAt, startsAt, endsAt, summary, location, url, description FROM Event WHERE accountId = ?',
    [req.accountId]
  );  

  for( let e = 0; e < results.length; e++ ) {
    results[e].startsAt = results[e].startsAt.toISOString().substring( 0, 10 );
    results[e].endsAt = results[e].endsAt.toISOString().substring( 0, 10 );
  }

  res.json( results.length > 0 ? results : null );
} );

// Read single record for given ID
router.get( '/:id', async ( req, res ) => {
  const [results, fields] = await req.db.query(
    'SELECT token AS id, createdAt, updatedAt, startsAt, endsAt, summary, location, url, description FROM Event WHERE token = ? AND accountId = ?',
    [req.params.id, req.accountId]
  );  

  for( let e = 0; e < results.length; e++ ) {
    results[e].startsAt = results[e].startsAt.toISOString().substring( 0, 10 );
    results[e].endsAt = results[e].endsAt.toISOString().substring( 0, 10 );
  }

  res.json( results.length > 0 ? results[0] : null );
} );

// Create a new record for a given account
router.post( '/:id', async ( req, res ) => {
  // TODO: Match path ID and token from body; error otherwise
  await req.db.query(
    'INSERT INTO Event ( token, startsAt, endsAt, summary, location, url, description, accountId ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ? )',
    [req.body.id, req.body.startsAt, req.body.endsAt, req.body.summary, req.body.location, req.body.url, req.body.description, req.accountId] 
  );

  res.json( req.body );
} );

// Update an existing record for a given account
router.put( '/:id', async ( req, res ) => {
  // TODO: Match path ID and token from body; error otherwise
  await req.db.query(
    'UPDATE Event SET token = ?, updatedAt = ?, startsAt = ?, endsAt = ?, summary = ?, location = ?, url = ?, description = ? WHERE token = ? AND accountId = ?',
    [req.body.id, new Date( req.body.updatedAt ), req.body.startsAt, req.body.endsAt, req.body.summary, req.body.location, req.body.url, req.body.description, req.body.id, req.accountId] 
  );

  res.json( req.body );
} );

// Delete a record for a given account
router.delete( '/:id', async ( req, res ) => {
  await req.db.query(
    'DELETE FROM Event WHERE token = ? AND accountId = ?',
    [req.params.id, req.accountId] 
  );

  res.json( {
    id: req.params.id
  } );
} );

// Export
module.exports = router;
