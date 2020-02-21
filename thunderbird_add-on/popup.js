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
  maybeSet( /Kurs\/Workshop\/Seminar:\* (.+)\n/, "kurs" )
  maybeSet( /Datum \(von-bis\), Uhrzeit:\* (.+)\n/, "datum" )
  maybeSet( /Vor- und Nachname:\* (.+)\n/, "name" )
  maybeSet( /Straße und Hausnr\.: (.+)\n/, "adresse" )
  maybeSet( /PLZ Ort \(ggf\. Länderkennung\): (.+)\n/, "ort" )
  maybeSet( /Telefon tagsüber: (.+)\n/, "telefon" )
  maybeSet( /E-Mail:\* (.+)\n/, "email" )
  maybeSet( /Ich bin bereits im Haus bekannt\.\n/, "bekannt" )
  data.bekannt = data.bekannt == undefined ? "Ja" : "";
  maybeSet( /Kontoinhaber\/in: (.+)\n/, "inhaber" )
  maybeSet( /IBAN: (.+)\n/, "iban" )
  maybeSet( /IuuBAN: (.+)\n/, "uff" )
  maybeSet( /SWIFT-BIC: (.+)\n/, "bic" )
  maybeSet( /Bankname: (.+)\n/, "bank" )

  return data;
}

function updateHtml( mails ) {
  const el = document.querySelector( "main" );
  const text = [];

  text.push( `Es wurde${mails.length > 1 ? "n" : ""} ${mails.length} Mail${mails.length > 1 ? "s" : ""} ausgewählt.<br>` );

  mails.forEach( mail => text.push( `- ${mail.name}<br>` ) );

  el.innerHTML = text.join( "\n" );
}

function setDownloadHref( data ) {
  const el = document.querySelector( ".download" );

  const encodedData = encodeURIComponent( JSON.stringify( data ) );

  el.href = `http://localhost:90/?data=${encodedData}`;
}

function formatMails( mails ) {
  const data = mails.map( mail => {
    const res = [ [], [] ];

    Object.keys( mail )
      .filter( prop => mail[prop] != "" )
      .map( prop => {
        res[0].push( prop );
        res[1].push( mail[prop] );
      } );

    return res;
  } );

  console.log( data );

  return data;
}

async function main() {
  let mails = await getMessagesAsIds();
  mails = await Promise.all( mails.map( async id => await expandMessage( id ) ) );
  console.log( mails )
  mails = mails.map( mail => parseEmail( mail ) );
  console.log( mails )
  // extra validation?

  updateHtml( mails );

  const formattedMails = formatMails( mails );
  setDownloadHref( formattedMails );
}
main();
