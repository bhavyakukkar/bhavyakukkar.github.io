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
  rust: new Category({
    $: {
      'pixylene': new Entry({
        summary: "a pixel-art editor",
        content: new HTMLFile("pages/pixylene.html"),
      }),
    },
  }),
  kast: new Category({
    $: {
      'kast-json': new Entry({
        summary: "A JSON library for Kast",
        content: <a href="https://github.com/bhavyakukkar/kast-json">github</a>,
      }),
    },
  }),
};

// Generate a single category listing projects (entries) from all programming-languages
const all_code_lang_entries =
  new Category({
    $: Object.fromEntries(Object.entries(code).flatMap(flatten1)),
    summary: "projects from all langs",
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

export const data = {
  code: { collapsed: false, $: [all_code_lang_entries, code] },

  games: new Category({
    $: {
      'Parentheses Drive Me Crazy': new Entry({
        summary: "Game about using a car-gear to balance Lisp parentheses, made for the Spring Lisp game jam",
        content: (
          // thanks itch.io <3
          <iframe width="552" height="167" frameborder="0" src="https://itch.io/embed/4607513">
            <a href="https://nigelwithrow.itch.io/parentheses-drive-me-crazy">
              Parentheses Drive Me Crazy by nigelwithrow
            </a>
          </iframe>
        ),
      }),

      'catgirl live date': new Entry({
        summary: "A live date between two catgirls that can chat and emote, made for the catgirl game jam",
        content: (
          <iframe width="552" height="167" frameborder="0" src="https://itch.io/embed/4556211">
            <a href="https://accbsdinnyaa.itch.io/catgirl-live-date">
              catgirl live date by accbsdinnyaa
            </a>
          </iframe>
        ),
      }),

      'Tristet': new Entry({
        summary: "A different kind of an iteration on the popular falling-block game, made for the falling-block game jam",
        content: (
          <iframe height="167" width="552" frameborder="0" src="https://itch.io/embed/3887768">
            <a href="https://nigelwithrow.itch.io/tristet">
              Tristet by nigelwithrow
            </a>
          </iframe>
        )
      }),

      'Bonk to the Future': new Entry({
        summary: "Game by ves about finding pieces to upgrade your Delorean, made for Ludum-Dare game jam 60",
        content: (
          <div>
            <p>I did the music & audio for this game written in Kast</p>
            <iframe height="167" width="552" frameborder="0" src="https://itch.io/embed/5190894">
              <a href="https://vesdev.itch.io/bonk-to-the-future">
                Bonk to the Future by ves, kuviman, nigelwithrow
              </a>
            </iframe>
          </div>
        ),
      }),
    }
  }),

  music: { collapsed: false, $: {
    'heather-knife': new Category({
      $: {
        'brainworm-resin-pendant': { collapsed: true, $: brainworm_resin_pendant() }, 
      },
    }),
    'melodemon': new Category({}),
  } },

  blog: new Category({}),
} satisfies RootData;

export const links = {
  'github': "https://github.com/bhavyakukkar",
  'itch': "https://nigelwithrow.itch.io",
  'bandcamp/heather': "https://heatherknife.bandcamp.com",
  'bandcamp/melodemon': "https://melodemon.bandcamp.com",
};

