// Ekte fonter i nettlesertestene.
//
// Fontlenka i <head> går gjennom miljøets proxy og bruker 12 sekunder på å gi
// opp. Tidligere svarte testene med et tomt stilark: raskt, men da tegnet
// nettleseren i sin egen fallback-font. Den er smalere enn Archivo Black, så
// et oppsett kunne se ut til å få plass i testen og likevel flyte over kanten
// på telefonen — som «STYRKELOGG» gjorde på største tekst.
//
// Nå svarer vi med latin-utsnittet av de tre ekte fontene, servert av riggen.
export async function ekteFonter(page, base) {
  await page.route('**://fonts.googleapis.com/**', async (r) => {
    const svar = await fetch(base + '/__fonter/fonter.css');
    const css = (await svar.text()).replace(/url\(([\w-]+\.woff2)\)/g, 'url(' + base + '/__fonter/$1)');
    r.fulfill({ status: 200, contentType: 'text/css', body: css });
  });
  // Ingenting skal treffe gstatic lenger — men skulle en lenke smette forbi,
  // er det bedre å svare tomt enn å vente på proxyen.
  await page.route('**://fonts.gstatic.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'font/woff2', body: '' }));
  await page.addInitScript(() => { window.__ekteFonter = true; });
}
