import { Data, Category, Entry, flatten1, HTMLFile, RootData } from "./lib";
import { jsx } from "./jsx";

function BandcampTrackEntry({album_id, track_id}: {album_id: number, track_id: number}) {
  return (
    <iframe
      style="border: 0; width: 500px; height: 208px;"
      src={`https://bandcamp.com/EmbeddedPlayer/album=${album_id}/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/track=${track_id}/transparent=true/`}
      seamless
    >
      <a href="https://heatherknife.bandcamp.com/album/brainworm-resin-pendant">
        brainworm resin pendant by heather knife
      </a>
    </iframe>
  );
}

// CODE
const code: Data<Category> = {
  kast: new Category({
    $: {
      'kast-json': new Entry({
        summary: "A JSON library for Kast",
        content: <a href="https://github.com/bhavyakukkar/kast-json" c={true}>github</a>,
      }),
    },
  }),
  rust: new Category({
    $: {
      'json.rs': new Entry({
        summary: "A JSON library for Rust",
        content: <a href="https://github.com/bhavyakukkar/kast-json" c={true}>github</a>,
      }),
    },
  }),
};

// Generate a single category listing projects (entries) from all programming-languages
const all_code_lang_entries =
  new Category({
    $: Object.fromEntries(Object.entries(code).flatMap(flatten1)),
    summary: "(^ projects from all langs)",
  });

// MUSIC
const brainworm_resin_pendant = () => {
  const ID = 1503995608;
  return [
    new Entry({summary: "2023 Album", content: (
      // thanks bandcamp <3
      <iframe style="border: 0; width: 400px; height: 704px;" src="https://bandcamp.com/EmbeddedPlayer/album=1503995608/size=large/bgcol=ffffff/linkcol=0687f5/transparent=true/" seamless>
        <a href="https://heatherknife.bandcamp.com/album/brainworm-resin-pendant">
          brainworm resin pendant by heather knife
        </a>
      </iframe>
    )}),
    {
      '1. mall song':                      new Entry({ content: <BandcampTrackEntry album_id={ID} track_id={3133417937}/> }),
      '2. scarecrow envy doll':            new Entry({ content: <BandcampTrackEntry album_id={ID} track_id={2340621447}/> }),
      '3. neurotransmitter based economy': new Entry({ content: <BandcampTrackEntry album_id={ID} track_id={815792969}/> }),
      '4. s4e11 crawl space':              new Entry({ content: <BandcampTrackEntry album_id={ID} track_id={1575904345}/> }),
      '5. living for the knife':           new Entry({ content: <BandcampTrackEntry album_id={ID} track_id={4266891015}/> }),
      '6. departure song':                 new Entry({ content: <BandcampTrackEntry album_id={ID} track_id={3011166746}/> }),
    }
  ] satisfies Data<Entry>;
}

/*

{
  code => {
    code/:/kast-json: <html>
    code/:/rust-json: <html>
  }
  code/kast => {
    code/kast/:/json: <html>
  }
  code/rust => {
    code/rust/:/json: <html>
  }
}

# categories
index.html

# categories + entries
code/index.html
code/kast/index.html
code/rust/index.html

# categories + entries + entry
code/kast/json.html
code/rust/json.html

*/

const data = {
  code: { collapsed: false, $: [all_code_lang_entries, code] },

  music: { collapsed: false, $: {
    'heather knife': new Category({
      $: {
        'brainworm resin pendant': { collapsed: true, $: brainworm_resin_pendant() }, 
      },
    }),
    'melodemon': new Category({}),
  } },

  games: new Category({}),
  blog: new Category({}),
} satisfies RootData;

export default data;
