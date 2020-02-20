const express = require( "express" );
const bodyParser = require( "body-parser" );
const xlsx = require( "node-xlsx" ).default;

const app = express();

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: true } ) );

const router = express.Router();
router.get( "/", ( req, res ) => {
  console.log( "/" );

  if ( req.query.data ) {
    const data = JSON.parse( req.query.data );
    const xlsBuffer = xlsx.build( [ { name: "cobra import", data: data } ] );

    const today = new Date();
    res.setHeader( "Content-disposition", `attachment; filename=cobra-${today.getDate()}-${today.getMonth()+1}.xls` );
    res.contentType( "application/xls" );
    res.send( xlsBuffer );
  } else
    res.sendStatus( 400 );
} );

app.use( "/", router );

const port = 90;

app.listen( port, () => {
  console.log( `Server running on port ${port}.` );
} );

