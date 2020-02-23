const express = require( "express" );
const xlsx = require( "node-xlsx" ).default;

const router = express.Router();
router.get( "/", ( req, res ) => {
  console.log( "/" );

  if ( req.query.data ) {
    const data = JSON.parse( req.query.data );
    const xlsBuffer = xlsx.build( [ { name: "cobra import", data: data } ] );

    const today = new Date();
    res.setHeader( "Content-disposition", `attachment; filename=cobra.xlsx` );
    res.contentType( "application/xlsx" );
    res.send( xlsBuffer );
  } else
    res.sendStatus( 400 );
} );

const app = express();
app.use( "/", router );

const port = 90;
app.listen( port, () => {
  console.log( `Server running on port ${port}.` );
} );

