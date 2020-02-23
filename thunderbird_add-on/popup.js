// API docs: https://thunderbird-webextensions.readthedocs.io/en/68/messages.html

async function getMessagesAsIds() {
  const res = await browser.mailTabs.getSelectedMessages()
  const messages = res.messages
    .filter( m => m.subject.match( /Verbindliche Seminaranmeldung/ ) )
    .map( m => m.id );
  return messages;
}

async function expandMessage( id ) {
  const res = await browser.messages.getFull( id );
  const msg = res.parts[0].body || res.parts[0].parts[0].body;
  return msg;
}

function parseEmail( mail ) {
  const data = {};

  function maybeSet( regex, prop ) {
    const match = mail.match( regex );
    let val;
    if ( match )
      val = match[1];
    else
      val = "";

    data[prop] = val;
  }
  maybeSet( /Kurs\/Workshop\/Seminar:\* (.+?)(<\/dt>|\r\n|\n)/, "Kurs_Status" )
  data.Kurs_Status.replace( /(\r\n|\n)/, "" );
  maybeSet( /Datum \(von-bis\), Uhrzeit:\* (.+?)(<\/dt>|\r\n|\n)/, "Datum_Kundenart" )
  maybeSet( /Vor- und Nachname:\* (.+?)(<\/dt>|\r\n|\n)/, "name" )
  if ( data.name ) {
    const nameSplit = data.name.split( " " );
    data.Nachname = nameSplit.pop();
    data.Vorname = nameSplit.join( " " );
  } else {
    data.Vorname = ""
    data.Nachname = ""
  }
  delete data.name
  maybeSet( /Stra.+?e und Hausnr\.: (.+?)(<\/dt>|\r\n|\n)/, "Strasse" )
  maybeSet( /PLZ Ort \(ggf\. L.+?nderkennung\): (.+?)(<\/dt>|\r\n|\n)/, "Ort" )
  if ( data.Ort.match( /\d{5}/ ) ) {
    data.PLZ = data.Ort.match( /\d{5}/ )[0]
    const matches = data.Ort.match( /(.*)(?:\d{5})(.*)/ );
    const ortArr = [ matches[1], matches[2] ];
    data.Ort = ortArr.join( "" ).trim();
  }
  data.Land = "D"
  maybeSet( /Telefon tags.+?ber: (.+?)(<\/dt>|\r\n|\n)/, "Telefon" )
  maybeSet( /Telefon abends: (.+?)(<\/dt>|\r\n|\n)/, "Telefon_Abends_Mobil" )
  if ( data.Telefon == data.Telefon_Abends )
    data.Telefon_Abends = "";
  maybeSet( /E-Mail:\* (.+?)(<\/dt>|\r\n|\n)/, "Email" )
  maybeSet( /Ich bin bereits im Haus bekannt\./, "BereitsBekannt" )
  data.BereitsBekannt = data.BereitsBekannt == undefined ? "Ja" : "Nein";
  // maybeSet( /Kontoinhaber(\/in)?: (.+?)<\/li>/, "Kontoinhaber" )
  // maybeSet( /IBAN: (.+?)<\/li>/, "IBAN" )
  // maybeSet( /(SWIFT-)?BIC: (.+?)<\/li>/, "BIC" )
  // maybeSet( /Bankname: (.+?)<\/li>/, "Bank" )

  return data;
}

function updateHtml( mails ) {
  const el = document.querySelector( "main" );
  const text = [];

  text.push( `Es wurde${mails.length > 1 ? "n" : ""} ${mails.length} Mail${mails.length > 1 ? "s" : ""} ausgewählt.<br>` );

  mails.forEach( mail => text.push( `- ${mail.Vorname} ${mail.Nachname}<br>` ) );

  el.innerHTML = text.join( "\n" );
}

function setDownloadHref( data ) {
  const el = document.querySelector( ".download" );

  const encodedData = encodeURIComponent( JSON.stringify( data ) );

  el.href = `http://localhost:90/?data=${encodedData}`;
}

function formatMails( mails ) {
  const definitions = Object.keys( mails[0] );

  const data = mails.map( mail => {
    const res = [];

    // .filter( prop => mail[prop] != "" )
    Object.keys( mail )
      .map( prop => {
        res.push( mail[prop] );
      } );

    return res;
  } );
  data.unshift( definitions );

  return data;
}

async function main() {
  let mails = await getMessagesAsIds();
  mails = await Promise.all( mails.map( async id => await expandMessage( id ) ) );
  mails = mails.map( mail => parseEmail( mail ) );
  // extra validation?

  updateHtml( mails );
  if ( mails.length ) {
    const formattedMails = formatMails( mails );
    console.log( formattedMails )
    setDownloadHref( formattedMails );
  }
}
main();
