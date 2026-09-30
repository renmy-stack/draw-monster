// 英語 対応
// 言語の きめかた: 1. じぶんで えらんだ もの（タイトルの 🌐 か ?lang=en / ?lang=ja、端末に おぼえる）
//                  2. えらんで いなければ スマホの 設定（日本語 → 日本語、それ いがい → 英語）。AUTO が false の 間は 日本語
// ゲームの コードは 日本語の まま。画面に 出る ところ（textContent・innerHTML・textarea・canvas の 文字・シェア）で 英語に おきかえる
//   1. 文 まるごと（D）→ 2. 数字の 入る 文（R、上から じゅんに 置きかえ）→ 3. のこった 日本語は 言いまわし（P、長い ものから）
//   かざりの 名前・CPU の 名前は データ そのものを 英語に する
(function () {
  const KEYL = 'drawrobot.lang', AUTO = true;   // AUTO: スマホの 設定で 英語に する（2026-09-30 全員に）
  let pick = null;
  try {
    if (/[?&]lang=en(&|$)/.test(location.search)) localStorage.setItem(KEYL, 'en');
    if (/[?&]lang=ja(&|$)/.test(location.search)) localStorage.setItem(KEYL, 'ja');
    pick = localStorage.getItem(KEYL);
  } catch (e) {}
  const auto = AUTO && !/^ja/i.test(navigator.language || 'ja') ? 'en' : 'ja';
  const on = (pick === 'en' || pick === 'ja' ? pick : auto) === 'en';
  window.LANG = on ? 'en' : 'ja';
  // 切りかえ（タイトルの 🌐）: えらんだ ほうを おぼえて 読みなおす
  window.setLang = l => { try { localStorage.setItem(KEYL, l); } catch (e) {} location.replace(location.pathname + location.hash); };
  window.TRL = s => s;
  if (!on) return;
  document.documentElement.lang = 'en';

  const JP = /[぀-ヿ一-鿿！-～]/;
  const norm = s => s.replace(/\s+/g, ' ').trim();

  // ---- 文 まるごと ----
  const D = {
    // タイトル
    "かいて！<br>モンスターバトル": "Draw!<br>Monster Battle",
    "かいて！モンスターバトル": "Draw! Monster Battle",
    "からだ・うで・あし を かくと<br>モンスターが たたかうよ！": "Draw a body, an arm and a leg<br>and your monster will fight!",
    "ともだちの モンスター が とどいた！": "A friend's monster has arrived!",
    "じぶんの モンスター": "My monster",
    "タップで えらぶ・なおす": "Tap to pick / edit",
    "✏ タップで なおす・えらぶ": "✏ Tap to edit / pick",
    "🎁 ガチャ・かざる": "🎁 Gacha & Decorate",
    "この スマホの きろく": "Records on this phone",
    "ぼうけん": "Adventure",
    "モンスターを つくる": "Make a monster",
    "たたかう・なおす": "Fight / Edit",
    "みんなの さいきょう ぐんだん": "Everyone's Strongest Squad",
    "うらを クリアした みんなの 5 たい": "5 monsters by players who beat Hidden",
    "たおした！ もういちど ちょうせん": "Beaten! Try again",
    "ランクせん": "Ranked",
    "みんなの モンスターと じどうで たいせん": "Auto-battle everyone's monsters",
    "とうろくして みんなと じどうで たいせん！": "Enter and auto-battle everyone!",
    "とうろく ずみ・けいさんちゅう": "Entered · calculating",
    "ふたりで たたかう": "2 players",
    "1 だいで 2 にんで しょうぶ": "Battle on one phone",
    "どんな 5 たい？": "Who are the 5?",
    "コレクション": "Collection",
    "⭐ でんせつ（タップで しょうめいしょ）": "⭐ Legends (tap for certificate)",
    "👑 でんどういり": "👑 Hall of Fame",
    "📦 データの ひきつぎ": "📦 Transfer data",
    "あそびかた・つよさ": "How to play · Strength",
    "つくりかた": "How to make",
    "<b>からだ</b> → <b>うで</b> → <b>あし</b> の じゅんに<br>1 本ずつ かく": "Draw <b>body</b> → <b>arm</b> → <b>leg</b>,<br>one line each",
    "うでは <b>かた</b>、あしは <b>こし</b> に つく": "The arm attaches at the <b>shoulder</b>, the leg at the <b>hip</b>",
    "あしは ぐるぐる まわって あるく": "The leg spins around to walk",
    "つよさ": "Strength",
    "大きくて おもい<br>からだ": "Big, heavy<br>body",
    "タフ・パンチが おもい<br>ころびにくい": "Tough, heavy punches<br>hard to knock down",
    "小さくて かるい<br>からだ": "Small, light<br>body",
    "あたりにくい・すばやい<br>てかずが おおい": "Hard to hit, fast<br>lots of punches",
    "ながい うで": "Long arm",
    "とどく けど かるい": "Long reach, light hits",
    "みじかい うで": "Short arm",
    "れんだで ズドン": "Rapid heavy hits",
    "あそびかた": "How to play",
    "CPU 5 たいと <b>かちぬき</b><br>（まけたら 1 たいめから）": "Beat 5 CPUs <b>in a row</b><br>(lose and you start over)",
    "5 たい かちぬくと… <b>なにかが おこる！？</b>": "Beat all 5… and <b>something happens!?</b>",
    "<b>ふたりで たたかう</b> で<br>ひとつの スマホで たいせん": "<b>2 players</b>:<br>battle on one phone",
    "モンスターを <b>ともだちに おくって</b><br>しょうぶ": "<b>Send</b> your monster<br>to a friend",
    "かつと <b>コイン</b> が もらえる。<b>ガチャ</b> で かざりを あつめよう<br>（みための だけ。つよさは かわらない）": "Win to get <b>coins</b>. Collect decorations with <b>gacha</b><br>(looks only, no change in strength)",
    "<a href=\"/\">ほかの ゲーム</a>・<a href=\"/privacy/\">プライバシーポリシー</a>": "<a href=\"/\">More games</a> · <a href=\"/privacy/\">Privacy policy</a>",
    "← もどる": "← Back",
    "▶▶ はやおくり": "▶▶ Fast",
    "▶ ふつう": "▶ Normal",
    // ランクせん
    "モンスター ランクせん": "Monster Ranked",
    "あなたの モンスター": "Your monster",
    "なまえ（10 もじまで）": "Name (up to 10 characters)",
    "モンスターの なまえ": "Monster name",
    "いまの モンスターで とうろく": "Enter with this monster",
    "いまの モンスターで とうろくしなおす": "Re-enter with this monster",
    "ランキング（タップで れんしゅうじあい）": "Ranking (tap for a practice match)",
    "モンスターを つくる・なおす": "Make / edit monster",
    "タイトルへ": "Title",
    "よみこみちゅう…": "Loading…",
    "いま ランクせんに つながらないよ。しばらく してから また きてね": "Can't reach Ranked right now. Please come back later.",
    "📸 じゅんい カードを つくる": "📸 Make a rank card",
    "ひさしぶり！ おやすみ から ふっかつ。だいたい 20 ぷんで ランキングに もどるよ": "Welcome back! You'll be back in the ranking in about 20 minutes.",
    "なまえが みんなに みせるのに ふさわしくないので、ランキングに だして いないよ。なまえを かえて とうろくしなおしてね": "This name isn't shown in the ranking. Please re-enter with a different name.",
    "つよい あいてとの たいせん（タップで リプレイ）": "Battles vs strong opponents (tap to replay)",
    "みんなとの たいせんを けいさんちゅう。だいたい 20 ぷんで でるよ": "Calculating battles with everyone. Results in about 20 minutes.",
    "けいさんちゅう（20 ぷんくらい）": "Calculating (about 20 min)",
    "ルール": "Rules",
    "みんなの モンスターと たたかった しょうりつで じゅんいが きまる": "Rank = win rate vs everyone's monsters",
    "よる 0 じに 1 いの モンスターが チャンピオン": "#1 at midnight becomes champion",
    "7 にち あそばないと おやすみ（ひらくと もどる）": "Entries rest after 7 days away (open the game to return)",
    "とうろく できたよ！": "Entered!",
    "いまの モンスターを とうろくすると、みんなの モンスターと じどうで たたかって じゅんいが きまるよ": "Enter your monster to auto-battle everyone's monsters and get a rank",
    "まず モンスターを つくってね": "Make a monster first",
    "あたらしい なまえで とうろくしなおしてね": "Please re-enter with a new name",
    "とうろくしなおすと みんなと たたかい なおして じゅんいが きまるよ": "Re-entering battles everyone again for a new rank",
    "まだ だれも とうろく して いないよ": "No one has entered yet",
    "なまえを いれてね": "Enter a name",
    "とうろくちゅう…": "Entering…",
    "とうろく できたよ！ だいたい 20 ぷんで みんなとの たいせん けっかが でるよ": "Entered! Results in about 20 minutes.",
    "つながらなかった…もういちど ためしてね": "Couldn't connect… please try again",
    "あいてが みつからなかった": "Opponent not found",
    "れんしゅうじあいは モンスターを つくってから": "Make a monster before practice matches",
    "いまの モンスターで とうろく できるよ": "You can enter Ranked with this monster",
    "かち": "Win", "まけ": "Loss", "わけ": "Draw", "ひだり": "Left", "みぎ": "Right",
    // サーバーの ことば
    "なまえは 10 もじまで": "Names are up to 10 characters",
    "つかえない もじが あるよ": "Contains characters that can't be used",
    "すうじが ながすぎるよ": "Too many digits",
    "CPU から はじまる なまえは つかえないよ": "Names can't start with CPU",
    "その なまえは つかえないよ": "That name can't be used",
    "その モンスターは とうろく できないよ": "That monster can't be entered",
    "きょうは もう たくさん とうろく したよ。また あした！": "You've entered a lot today. See you tomorrow!",
    "すこし まってから もういちど ためしてね": "Please wait a moment and try again",
    "データが おおきすぎるよ": "The data is too big",
    "コードは 8 もじ だよ": "The code is 8 characters",
    "その コードは みつからないよ": "Code not found",
    // かく 画面
    "からだ": "Body", "うで": "Arm", "あし": "Leg",
    "タフさ": "Tough", "パンチ": "Punch", "リーチ": "Reach", "はやさ": "Speed",
    "おもて": "Normal", "うら": "Hidden", "みんな": "Squad",
    "たたかう": "Fight",
    "ともだち<small>と たたかう</small>": "Fight<small>your friend</small>",
    "この パーツを けす": "Erase this part",
    "ほぞん": "Save", "おくる": "Send", "もどる": "Back",
    "<b>からだ</b> を かこむように かいてね": "Draw the <b>body</b> as one shape",
    "<b>かた</b>（きいろい ●）から <b>うで</b> を かいてね": "Draw the <b>arm</b> from the <b>shoulder</b> (yellow ●)",
    "<b>こし</b>（きいろい ●）から <b>あし</b> を かいてね": "Draw the <b>leg</b> from the <b>hip</b> (yellow ●)",
    "もうすこし おおきく かいてね": "Draw it a bit bigger",
    "からだを かえたので、うで・あしも くっつけなおしたよ": "The body changed, so the arm and leg were reattached",
    "かちぬき ちゅう：モンスターを かえると 1 たいめから": "On a streak: changing your monster restarts from #1",
    "うら かちぬき：とんでもなく つよい 5 たい": "Hidden streak: 5 super strong monsters",
    "みんなの さいきょう ぐんだん：うらを クリアした みんなの モンスターから えらばれた 5 たい":"Everyone's Strongest Squad: 5 monsters picked from players who beat Hidden",
    "できた！<small>2P に わたす</small>": "Done!<small>pass to 2P</small>",
    "たたかう！<small>1P たい 2P</small>": "Fight!<small>1P vs 2P</small>",
    // 結果
    "かち！": "You win!", "まけ…": "You lose…", "ひきわけ": "Draw",
    "1P の かち！": "1P wins!", "2P の かち！": "2P wins!",
    "つぎの あいてへ": "Next opponent",
    "もういちど": "Again",
    "もういちど<small>なおして たたかう</small>": "Again<small>edit and fight</small>",
    "おなじ たたかいを みる": "Watch the same fight",
    "もういちど みる": "Watch again",
    "ランクせんへ もどる": "Back to Ranked",
    // きょうの イベント
    "きょうの イベント": "Today's Event",
    "きょうの イベント<br>ランクせん": "Today's Event<br>Ranked",
    // なかまランキング
    "みんな": "Everyone",
    "なかまリーグ": "Friends league",
    "なかま": "Friends",
    "なかまで そうあたりして じゅんいを くらべよう（ランクせんに とうろくした モンスターで たたかう）": "Everyone in your group battles everyone (using their Ranked monsters)",
    "＋ なかまを つくる": "+ Make a group",
    "🔑 コードで はいる": "🔑 Join with a code",
    "📨 さそう": "📨 Invite",
    "つくる": "Make",
    "はいる": "Join",
    "やめる": "Cancel",
    "この なかまを ぬける": "Leave this group",
    "なかまへ もどる": "Back to friends",
    "つくってるよ…": "Making…",
    "はいってるよ…": "Joining…",
    "ぬけたよ": "You left the group",
    "ほんとうに ぬける？（もういちど おす）": "Really leave? (tap again)",
    "なかまの なまえ（10 もじまで）": "Group name (up to 10 characters)",
    "なかまコード（6 もじ）": "Group code (6 characters)",
    "れい: 3くみ": "e.g. Class 3",
    "れい: K7M2QX": "e.g. K7M2QX",
    "なかまを つくって、ともだちに コードを おくろう。なかまの 中で だれが いちばん つよいか くらべられるよ": "Make a group and send the code to friends. See who is strongest in your group!",
    "あなたも ランクせんに とうろくすると ここに でるよ": "Enter Ranked to show up here too",
    "その なかまは みつからないよ": "That group was not found",
    "コードは 6 もじ だよ": "The code is 6 characters",
    "つながらなかった…しばらく してから また きてね": "Couldn't connect… please come back later",
    "きょうは もう たくさん つくったよ。また あした！": "You made a lot today. See you tomorrow!",
    "れんしゅうじあいは モンスターを つくってから": "Make a monster first to play practice matches",
    "コードを いれてね": "Enter a code",
    "なかまが ランクせんに とうろくすると そうあたりで たたかうよ": "When friends enter Ranked, everyone battles everyone",
    // 下の タブ
    "まだ モンスターが いないよ": "No monster yet",
    "✏ タップで つくる": "✏ Tap to make one",
    "そのほか": "More",
    "イベント": "Event",
    "ガチャ": "Gacha",
    "きょうの イベント ランクせん": "Today's Event Ranked",
    "1 にちで きまる ランクせん": "One-day ranked",
    "きょうの お題の パーツは みんな おなじ かたち（かえられない）": "Today's theme part is the same shape for everyone (can't change it)",
    "ほかの 2 つを かいて だすと、みんなと じどうで たたかって じゅんいが きまる": "Draw the other 2 parts and enter — you auto-battle everyone for a rank",
    "なんかいでも だしなおせる（さいごに だした 1 たいで きまる）": "Re-enter as often as you like (your last entry counts)",
    "よる 0 じに しめきり。1 いに 🎀 リボン": "Closes at midnight (Japan time). #1 gets a 🎀 ribbon",
    "つぎの 日は べつの お題": "A new theme every day",
    "あなたの イベント モンスター": "Your event monster",
    "この モンスターで だす": "Enter this monster",
    "この モンスターで だしなおす": "Re-enter with this monster",
    "イベントの モンスターを かく": "Draw your event monster",
    "イベントの モンスターを なおす": "Edit your event monster",
    "きょうの ランキング（タップで れんしゅうじあい）": "Today's ranking (tap for a practice match)",
    "いま イベントに つながらないよ。しばらく してから また きてね": "Can't reach the event right now. Please come back later",
    "お題の パーツは きまってるよ。のこりの 2 つを かいて だしてね": "The theme part is fixed. Draw the other 2 parts and enter!",
    "だしなおすと まえの モンスターと いれかわるよ": "Re-entering replaces your previous monster",
    "きょうは もう たくさん だしたよ。また あした！": "You've entered a lot today. See you tomorrow!",
    "まだ だれも だして いないよ。いちばん のりで だそう！": "No entries yet. Be the first!",
    "まだ たたかう あいてが いないよ（2 たい から じゅんいが でるよ）": "No opponents yet (ranks appear from 2 entries)",
    "できたよ！ なまえを いれて だしてね": "Done! Enter a name and submit",
    "だしてるよ…": "Entering…",
    "だしたよ！ 20 ぷん くらいで じゅんいが でるよ": "Entered! Your rank shows up in about 20 min",
    "れんしゅうじあいは イベントの モンスターを かいてから": "Draw your event monster first to play practice matches",
    "なまえが みんなに みせるのに ふさわしくないので、ランキングに だして いないよ": "Your name isn't shown in the ranking because it isn't suitable for everyone",
    "その モンスターは だせないよ": "That monster can't be entered",
    "できた！<small>イベントに もどる</small>": "Done!<small>Back to the event</small>",
    "イベントへ もどる": "Back to the event",
    "モンスターを なおす": "Edit monster",
    "モンスターを なおす（1 たいめから）": "Edit monster (restart from #1)",
    "でんせつ しょうめいしょ": "Legend certificate",
    "この モンスターで ランクせんに でる": "Enter Ranked with this monster",
    "モンスターを おくる": "Send monster",
    "うら かちぬき へ！<small>とんでもなく つよい 5 たい</small>": "On to Hidden!<small>5 super strong monsters</small>",
    "みんなの さいきょう<br>ぐんだん へ！<small>うらを クリアした みんなの 5 たい</small>": "On to Everyone's<br>Strongest Squad!<small>5 monsters by players who beat Hidden</small>",
    "おもてを もういちど": "Normal again", "うらを もういちど": "Hidden again", "1 たいめから もういちど": "Restart from #1",
    "ともだちの モンスター と しょうぶ": "Battle your friend's monster",
    "リプレイ": "Replay", "れんしゅうじあい（てんすうは かわらない）": "Practice match (rank doesn't change)",
    "みんなの さいきょう ぐんだん を": "You beat Everyone's Strongest Squad",
    "たおした！！！": "!!!",
    "でんせつ の モンスター に なった！": "Your monster became a LEGEND!",
    "うら 5 たい かちぬき たっせい！！": "You beat all 5 Hidden monsters!!",
    "すごすぎる！": "Amazing!",
    "…みんなの さいきょう ぐんだん が": "…Everyone's Strongest Squad",
    "あらわれた！": "has appeared!",
    "まってるぞ…！": "is waiting…!",
    "5 たい かちぬき たっせい！": "You beat all 5!",
    "…うら かちぬき が あらわれた！": "…Hidden mode has appeared!",
    "うら かちぬき が まってるぞ…！": "Hidden mode is waiting…!",
    "さいこう きろく！": "New best!",
    "ダウン！": "DOWN!", "ファイト！": "FIGHT!", "KO！": "KO!", "じかんぎれ": "TIME UP",
    // 2 人・ほぞん・おくる
    "2P に わたしてね": "Pass to 2P",
    "1P の モンスターは かくしてあるよ。2P は みないで かいてね！": "1P's monster is hidden. 2P, draw without peeking!",
    "2P が かく": "2P draws",
    "モンスターの ほぞん": "Saved monsters",
    "いまの モンスターを ほぞん・ほぞんした モンスターを よびだす": "Save this monster or load a saved one",
    "とじる": "Close",
    "から": "Empty",
    "ばんごうを タップして えらんでね（🏆 ランクせんに とうろくちゅう・✏️ いまの モンスター）": "Tap a number (🏆 entered in Ranked · ✏️ current monster)",
    "よびだす": "Load", "ここに うわがき": "Overwrite", "ほんとうに うわがき？": "Really overwrite?", "ここに ほぞん": "Save here",
    "からだ・うで・あし を ぜんぶ かいてから ほぞん してね": "Draw the body, arm and leg before saving",
    "ほんとうに けす？": "Really delete?", "けす": "Delete",
    "この文を LINE などで ともだちに おくってね": "Send this text to a friend",
    "文をコピー": "Copy text", "コピーしました": "Copied",
    // ひきつぎ
    "データの ひきつぎ": "Transfer data",
    "きしゅへんこう や べつの ブラウザ（X の なか → Safari など）に、コイン・かざり・ほぞん・きろく・ランクせん を うつせるよ": "Move your coins, decorations, saves, records and Ranked entry to a new phone or another browser (e.g. X app → Safari)",
    "この スマホの データを あずける": "Store this phone's data",
    "データを あずける": "Store data",
    "いまの データで あずけなおす": "Store again with current data",
    "べつの スマホの データを うけとる": "Receive data from another phone",
    "うけとる": "Receive",
    "いまの データは きえるよ。うけとる？": "Your current data will be replaced. Receive?",
    "あずけちゅう…": "Storing…", "うまく いかなかった…": "Something went wrong…",
    "あずけたよ！ この コードを スクショ か メモ してね": "Stored! Take a screenshot or write down this code",
    "コードは 8 もじ（れい: K7M2-QX9P）": "The code is 8 characters (e.g. K7M2-QX9P)",
    "うけとりちゅう…": "Receiving…", "ほぞん できなかった…": "Couldn't save…", "うけとったよ！ よみこみなおすね": "Received! Reloading…",
    // みんなの ぐんだん の せつめい
    "みんなの<br>さいきょう ぐんだん": "Everyone's<br>Strongest Squad",
    "みんなが かいた モンスター<br><b>2 まん しゅるい いじょう</b>": "Monsters drawn by players:<br><b>over 20,000</b>",
    "うら かちぬき を クリアできたのは<br><b>133 たい</b>": "Monsters that beat Hidden:<br><b>133</b>",
    "その 133 たいで <b>そうあたり</b><br>（ぜんぶで 17,556 せん）": "Those 133 fought <b>round-robin</b><br>(17,556 battles)",
    "いちばん やぶられにくい<br><b>5 たいの くみあわせ</b> を えらんだ": "We picked the<br><b>hardest team of 5 to beat</b>",
    "みんなの モンスター 1,600 たいと たたかわせても<br>5 たい ぜんぶに かてたのは <b>0 たい</b>！": "Against 1,600 players' monsters,<br>the number that beat all 5 was <b>0</b>!",
    "ぜんぶ みんなが かいた モンスター。<br>かてば <b>でんせつ</b>！": "All drawn by players.<br>Win to become a <b>legend</b>!",
    // ガチャ
    "ガチャ・かざる": "Gacha & Decorate",
    "ガチャを ひく<small>🪙 100</small>": "Pull<small>🪙 100</small>",
    "10れん ＋1<small>🪙 1000（11 かい）</small>": "10+1 pull<small>🪙 1000 (11 pulls)</small>",
    "かったら コインが もらえるよ。おなじ かたちで おなじ あいてに かつと はんぶんずつ へる。かたちを かえると もどる！": "Win to earn coins. Beating the same opponent with the same shape halves the reward each time. Change your shape to reset it!",
    "やったー！": "Yay!", "なし": "None", "ゲット！": "Got it!", "ゲット！！": "GET!!",
    "👀 おためし（まだ つけて ないよ）": "👀 Preview (not equipped yet)",
    "スキップ ▶▶": "Skip ▶▶", "ガラガラガラ…": "Rattle rattle…", "ガラガラ…": "Rattle…", "タップで あける！": "Tap to open!",
    "きんいろに なった！！": "It turned gold!!", "いろが かわった！": "The color changed!", "タップで つぎへ": "Tap to continue", "ガチャ": "GACHA",
    // しょうめいしょ・カード・エンディング
    "でんせつ しょうめいしょ（ながおしで ほぞん）": "Legend certificate (long-press to save)",
    "じゅんい カード（ながおしで ほぞん）": "Rank card (long-press to save)",
    "シェア（X など）": "Share (X etc.)",
    "でんせつ": "LEGEND", "しょうめいしょ": "CERTIFICATE", "たおした！": " ",
    "じぶん": "You", "ともだち": "Friend",
    " い": "", "い": "",
    "たおした 10 たい": "Defeated 10", "おめでとう！": "Congrats!", "うら 5 にんぬき たっせい！": "You beat all 5 Hidden!", "おうかんを もらった！": "You got a crown!",
  };
  const Dn = {}; for (const [k, v] of Object.entries(D)) Dn[norm(k)] = v;

  // ---- 数字の 入る 文（上から じゅんに 置きかえ）----
  const R = [
    [/(おもて|うら|みんな) クリア/g, (m, a) => SIDE[a] + ' ✓'],
    [/✓ クリア/g, '✓ Clear'],
    [/^コレクション ?(?:⭐ でんせつ (\d+) ?)?(?:👑 でんどういり (\d+))?$/, (m, a, b) => 'Collection' + (a ? ' ⭐ Legends ' + a : '') + (b ? ' 👑 Hall of Fame ' + b : '')],
    [/(1P|2P) の モンスターを かいてね/, '$1, draw your monster'],
    [/（まえの モンスターが はいってるよ）/, ' (your last monster is loaded)'],
    [/^うら かちぬき (\d+) \/ (\d+)$/, 'Hidden $1 / $2'],
    [/^みんなの さいきょう かちぬき (\d+) \/ (\d+)$/, 'Squad $1 / $2'],
    [/^かちぬき (\d+) \/ (\d+)$/, 'Streak $1 / $2'],
    [/KO（([\d.]+) びょう）/g, 'KO ($1 s)'],
    [/じかんぎれ（のこり HP (\d+) たい (\d+)）/g, 'Time up (HP left $1 vs $2)'],
    [/^のこり HP 1P (\d+) 2P (\d+)$/, 'HP left: 1P $1, 2P $2'],
    [/^パンチ (\d+) はつ・ダメージ (\d+)$/, 'Punches $1 · Damage $2'],
    [/^(\d+) にんぬき で おわり$/, 'Ended after $1 wins'],
    [/（おなじ かたちで かちすぎ！ かたちを かえると もどるよ）/, ' (too many wins with this shape! change it to reset)'],
    [/（この かたちで (\d+) かいめ → へったよ）/, ' (win #$1 with this shape → less)'],
    [/ もちコイン (\d+)$/, ' · coins $1'],
    [/^もう もってた… 🪙 \+(\d+) もどったよ$/, 'Already had it… 🪙 +$1 back'],
    [/^NEW！ (.+?)の いちらんから つけてね$/, (m, a) => 'NEW! Equip it from the ' + (SLOT[a] || a) + ' list'],
    [/^NEW (\d+) こ/, 'NEW $1'],
    [/・かぶり 🪙 \+(\d+)/, ' · duplicates 🪙 +$1'],
    [/<br>かぶり 🪙 \+(\d+)/, '<br>Duplicate 🪙 +$1'],
    [/^10れん ＋1 の けっか：NEW (\d+) こ$/, '10+1 results: NEW $1'],
    [/いま: /, 'Now: '],
    [/^(\d+) たい さんか・20 ぷんごとに こうしん$/, '$1 entered · updates every 20 min'],
    [/<b>👑 きのうの チャンピオン<\/b>/, "<b>👑 Yesterday's champion</b>"],
    [/^なかまリーグ けいさんちゅう (\d+) \/ (\d+)$/, 'Friends league: calculating $1 / $2'],
    [/^なかまリーグ（そうあたり (\d+) せん おわり！）$/, 'Friends league (all $1 matches done!)'],
    [/^⚔️ そうあたり けいさんちゅう… (\d+)%（(\d+) \/ (\d+) せん）じゅんいは まだ かわるよ$/, '⚔️ Battling everyone… $1% ($2 / $3) ranks may still change'],
    [/^なかまリーグ（そうあたり (\d+) せん）$/, 'Friends league (round robin, $1 matches)'],
    [/^(\d+)しょう (\d+)はい(?: (\d+)わけ)?/, (m, w, l, d) => w + 'W ' + l + 'L' + (d ? ' ' + d + 'D' : '')],
    [/（ぜんたい ([\d.]+)%）/, ' (all $1%)'],
    [/^なかまコード: ([A-Z0-9]+)$/, 'Group code: $1'],
    [/^まだ ランクせんに とうろく してない なかま (\d+) にん$/, '$1 friend(s) have not entered Ranked yet'],
    [/^なかまは (\d+) つまで。どれかを ぬけてから (つくって|はいって)ね$/, 'Up to $1 groups. Leave one first'],
    [/^この なかまは もう いっぱい（(\d+) にん）$/, 'This group is full ($1)'],
    [/^ぜんたい ([\d.]+)%$/, 'all $1%'],
    [/・ぜんたい ([\d.]+)%$/, ' · all $1%'],
    // きょうの イベント（お題の 名前は 英語の データ、日の 名前は あとの 言いまわしで）
    [/^(\d+) たい さんか・よる 0 じ しめきり（あと (\d+) じかん）$/, '$1 entered · closes at midnight ($2 h left)'],
    [/^🎀 きょうは (.+)$/, '🎀 Today: $1'],
    [/（(からだ|うで|あし) は みんな この かたち）$/, (m, p) => ' (everyone gets this ' + ({ 'からだ': 'body', 'うで': 'arm', 'あし': 'leg' })[p] + ')'],
    [/<b>🎀 きのうの (.+) いちばん<\/b>/, "<b>🎀 Yesterday's #1: $1</b>"],
    [/<b>🎀 きのうの けっかを けいさん ちゅう…<\/b><br>0 じ 10 ぷん ごろ に でるよ/, "<b>🎀 Counting yesterday's results…</b><br>Ready around 0:10 (JST)"],
    [/（しょうりつ ([\d.]+)%・(\d+) たい）$/, ' (win $1% · $2 entries)'],
    [/^🎀 きのうの (.+) いちばん！ リボンを もらったよ$/, "🎀 #1 on yesterday's $1! You got a ribbon"],
    [/^🎀 きのうの (.+) いちばん$/, "🎀 Yesterday's #1: $1"],
    [/^🎀 リボン (\d+) こ（あなたの モンスターに つくよ）$/, '🎀 Ribbons: $1 (shown on your monster)'],
    [/^きょうの お題：(\S+) は(.+)（かえられない）$/, (m, p, n) => "Today's theme: the " + ({ 'からだ': 'body', 'うで': 'arm', 'あし': 'leg' })[p] + ' is' + n + ' (fixed)'],
    [/^きょうは (\S+) は きまった かたち(.+)だよ$/, (m, p, n) => 'Today the ' + ({ 'からだ': 'body', 'うで': 'arm', 'あし': 'leg' })[p] + ' is fixed:' + n],
    [/^🔒 (\S+) は きょうの お題(.+)$/, (m, p, n) => "🔒 The " + ({ 'からだ': 'body', 'うで': 'arm', 'あし': 'leg' })[p] + " is today's theme:" + n],
    [/（しょうりつ ([\d.]+)%）/g, ' (win $1%)'],
    [/👑 きのうの チャンピオン（(\d+) にち れんぞく！?）/g, "👑 Yesterday's champion ($1 days in a row)"],
    [/👑 きのうの チャンピオン！?/g, "👑 Yesterday's champion"],
    [/👑 チャンピオン(\d+) にち れんぞく・/g, '👑 Champion $1 days · '],
    [/ ?(\d+) にち れんぞく！?/g, ' $1 days in a row'],
    [/(\d+) い \/ (\d+) たい/g, '#$1 of $2'],
    [/しょうりつ ([\d.]+)%/g, 'win $1%'],
    [/（(\d+)しょう (\d+)はい(?: (\d+)わけ)?）/g, (m, w, l, d) => ' (' + w + 'W ' + l + 'L' + (d ? ' ' + d + 'D' : '') + ')'],
    [/けいさんちゅう (\d+)\/(\d+)/g, 'calculating $1/$2'],
    [/👑 チャンピオン・/g, '👑 Champion · '],
    [/いま (\d+) い（(\d+) たい）/g, 'Now #$1 of $2 '],
    [/↑ あがった！/g, '↑ up!'],
    [/^ランクせん (\d+) い・/, 'Ranked #$1 · '],
    [/^ランクせん けいさんちゅう/, 'Ranked: calculating'],
    [/（べつの モンスターで とうろくちゅう）/, ' (entered with another monster)'],
    [/（あなた）$/, ' (you)'],
    [/^🏆 チャンピオン メダルを もらった！（チャンピオン (\d+) かいめ）$/, '🏆 You got a champion medal! (champion #$1)'],
    [/^(\d+) たい ちゅう$/, 'of $1'],
    [/^ランクせんで (\d+) い（(\d+) たい ちゅう）！「(.*)」と たたかってみて！（かいて！モンスターバトル）$/, "I'm #$1 of $2 in Ranked! Fight \"$3\"! (Draw! Monster Battle)"],
    [/^ぼくの モンスター と たたかってみて！（かいて！モンスターバトル）$/, 'Fight my monster! (Draw! Monster Battle)'],
    [/^みんなの さいきょう ぐんだん を たおして でんせつ に なった！（かいて！モンスターバトル）$/, "I beat Everyone's Strongest Squad and became a legend! (Draw! Monster Battle)"],
    [/^(\d+) を よびだしたので かちぬきは 1 たいめから$/, 'Loaded $1, so the streak restarts from #1'],
    [/^(\d+) を よびだしました$/, 'Loaded $1'],
    [/^(\d+) に ほぞん しました$/, 'Saved to $1'],
    [/^(\d+) を けしました$/, 'Deleted $1'],
    [/^(\d+\/\d+) まで つかえるよ（あずけなおすと のびる）$/, 'Valid until $1 (store again to extend)'],
    [/▶ たたかう/g, '▶ Fight'],
    [/たたかう<small>/g, 'Fight<small>'],
    [/<b>？？？<\/b>/g, '<b>???</b>'],
    [/>なし</g, '>None<'],
  ];
  // ---- のこった 言いまわし ----
  const SIDE = { 'おもて': 'Normal', 'うら': 'Hidden', 'みんな': 'Squad' };
  const SLOT = { 'あたま': 'Head', 'かお': 'Face', 'からだ': 'Body', 'えふぇくと': 'Effect' };
  const P = Object.entries(Object.assign({
    'かいて！モンスターバトル': 'Draw! Monster Battle', 'ランクせん': 'Ranked', 'けいさんちゅう': 'calculating',
    'たたかう': 'Fight', 'クリア': 'Clear',
    'からだの日': 'Body day', 'うでの日': 'Arm day', 'あしの日': 'Leg day',
  }, SIDE)).sort((a, b) => b[0].length - a[0].length);

  const cache = new Map();
  function tr(s) {
    if (typeof s !== 'string' || !JP.test(s)) return s;
    if (cache.has(s)) return cache.get(s);
    let out;
    if (s.includes('\n')) out = s.split('\n').map(tr).join('\n');
    else {
      const k = norm(s);
      if (Dn[k] != null) out = Dn[k];
      else {
        out = k;
        for (const [re, to] of R) out = out.replace(re, to);
        if (JP.test(out)) { const k2 = norm(out); if (Dn[k2] != null) out = Dn[k2]; }
        if (JP.test(out)) for (const [a, b] of P) out = out.split(a).join(b);
      }
    }
    if (cache.size > 3000) cache.clear();
    cache.set(s, out);
    return out;
  }
  window.TRL = tr;

  // ---- データ そのものを 英語に ----
  const KZN = { 'つの': 'Horns', 'リボン': 'Ribbon', 'はちまき': 'Headband', 'シルクハット': 'Top hat', 'まほうの ぼうし': 'Wizard hat', 'てんしの わ': 'Halo', 'ぐるぐるめ': 'Swirly eyes', 'サングラス': 'Sunglasses', 'ちょびひげ': 'Mustache', 'でっかい きば': 'Big fangs', 'ひとつめ': 'Cyclops eye', 'ハートの め': 'Heart eyes', 'しましま': 'Stripes', 'みずたま': 'Polka dots', 'ほしぞら': 'Starry sky', 'きんいろ': 'Gold', 'にじいろ': 'Rainbow', 'クリスタル': 'Crystal', 'あしあとに はな': 'Flower steps', 'パンチで ほし': 'Star punch', 'あせ': 'Sweat', 'ほのお': 'Flames', 'かみなり': 'Thunder', 'オーラ': 'Aura', 'ねこみみ': 'Cat ears', 'うさみみ': 'Bunny ears', 'ヘルメット': 'Helmet', 'アンテナ': 'Antenna', 'はっぱ': 'Leaves', 'ベレーぼう': 'Beret', 'かぼちゃの ぼうし': 'Pumpkin hat', 'ナイトの かぶと': 'Knight helm', 'サンタぼう': 'Santa hat', 'きょうりゅうの とさか': 'Dino crest', 'ヘッドホン': 'Headphones', 'ほのおの かみ': 'Flame hair', 'ユニコーンの つの': 'Unicorn horn', 'うちゅうの ヘルメット': 'Space helmet', 'ほっぺ': 'Blush', 'まゆげ': 'Eyebrows', 'ばんそうこう': 'Bandage', 'べろ': 'Tongue', 'まるメガネ': 'Round glasses', 'ねむいめ': 'Sleepy eyes', 'ピエロの はな': 'Clown nose', 'かいぞくの アイパッチ': 'Pirate patch', 'ロボの め': 'Robot eyes', 'キラキラの め': 'Sparkly eyes', 'ヒーローマスク': 'Hero mask', 'レーザーアイ': 'Laser eyes', 'ぎんがの め': 'Galaxy eyes', 'ほのおの め': 'Fire eyes', 'チェック': 'Checks', 'ハートもよう': 'Hearts', 'ひょうがら': 'Leopard', 'うろこ': 'Scales', 'ツギハギ': 'Patchwork', 'めいさい': 'Camo', 'マグマ': 'Magma', 'こおり': 'Ice', 'メカ': 'Mecha', 'ドラゴンの うろこ': 'Dragon scales', 'さくら': 'Cherry blossom', 'うちゅう': 'Space', 'ホログラム': 'Hologram', 'オーロラ': 'Aurora', 'ハート': 'Hearts', 'おんぷ': 'Music notes', 'しゃぼんだま': 'Bubbles', 'すなぼこり': 'Dust', 'ゆき': 'Snow', 'ふぶき': 'Blizzard', 'どく': 'Poison', 'かぜ': 'Wind', 'みず': 'Water', 'かげぶんしん': 'Shadow clone', 'ドラゴンの つばさ': 'Dragon wings', 'ブラックホール': 'Black hole', 'きんいろの ひかり': 'Golden light' };
  const KZD = { 'あるくと あしあとに はなが さく': 'Flowers bloom where you step', 'パンチが あたると ほしが とびちる': 'Stars fly when a punch lands', 'たたかって いると あせが とぶ': 'Sweat flies while fighting', 'からだから ほのおが もえあがる': 'Flames rise from the body', 'でんきが はしって ときどき かみなりが おちる': 'Electricity crackles and lightning strikes', 'むらさきの オーラが あふれだす': 'A purple aura overflows', 'ハートが ふわふわ でてくる': 'Hearts float out', 'おんぷが ぽんぽん とびだす': 'Music notes pop out', 'しゃぼんだまが ふわっと うかぶ': 'Bubbles float up', 'あるくと すなぼこりが たつ': 'Dust rises as you walk', 'はっぱが まわりを まう': 'Leaves dance around', 'まわりに ゆきが ふる': 'Snow falls around you', 'こおりの かけらが まわりを まわる': 'Ice shards circle around', 'みどりの どくの もやと あわ': 'Green poison mist and bubbles', 'かぜが うずを まいて まわる': 'Wind swirls around', 'みずの おびが まわって しぶきが とぶ': 'A ribbon of water spins and splashes', 'うしろに かげの ぶんしんが ついてくる': 'A shadow clone follows behind', 'せなかに ドラゴンの つばさが はえて はばたく': 'Dragon wings sprout and flap', 'うしろで ブラックホールが うずまく': 'A black hole swirls behind', 'そらから きんいろの ひかりが さしこむ': 'Golden light shines from the sky' };
  if (window.KZ) {
    for (const it of KZ.ITEMS) if (it) { if (KZN[it.name]) it.name = KZN[it.name]; if (it.desc && KZD[it.desc]) it.desc = KZD[it.desc]; }
    if (KZ.SLOT_LABEL) for (const k of Object.keys(KZ.SLOT_LABEL)) KZ.SLOT_LABEL[k] = SLOT[KZ.SLOT_LABEL[k]] || KZ.SLOT_LABEL[k];
  }
  const CPUN = { 'ヒョロリ': 'Skinny', 'ドッシン': 'Thud', 'カクカク': 'Blocky', 'チョロ': 'Scamper', 'ゴツン': 'Bonk', 'カゲ': 'Shadow', 'ヤミ': 'Dark', 'ドクロ': 'Skull', 'オニ': 'Ogre', 'ダイマオウ': 'Demon King', 'ギザマル': 'Sawtooth', 'オオヤマ': 'Mountain', 'ワニガメ': 'Snapper', 'ハコブネ': 'Ark', 'カミソリ': 'Razor' };
  if (window.RB) for (const L of [RB.CPU, RB.URA, RB.MINNA]) if (L) for (const c of L) if (CPUN[c.name]) c.name = CPUN[c.name];
  // きょうの イベントの お題（event.js の 並びと おなじ 順。[名前, せつめい]）
  const EVN = {
    body: [['Star', 'a star'], ['Circle', 'perfectly round'], ['Square', 'a box'], ['Triangle', 'point up'], ['Upside-down', 'point down'], ['Heart', 'a heart'], ['Tall', 'thin and tall'], ['Flat', 'wide and flat'], ['Diamond', 'a diamond'], ['Crescent', 'a moon'], ['House', 'a house with a roof'], ['Mushroom', 'cap and stem'], ['Cloud', 'puffy'], ['Ghost', 'wavy hem'], ['Fish', 'with a tail'], ['Gourd', 'two circles stacked'], ['Cross', 'a plus sign'], ['Tiny', 'very small'], ['Cup', 'a U with a dent on top'], ['Two humps', 'two hills']],
    arm: [['Spear', 'long and straight'], ['Hammer', 'heavy head at the tip'], ['Hook', 'curls at the tip'], ['Zigzag', 'a lightning bolt'], ['Spiral', 'swirl at the tip'], ['Boomerang', 'bent in a V'], ['Fork', '3 prongs'], ['Ring', 'a ring at the tip'], ['Fist', 'short with a square tip'], ['Uppercut', 'reaches up at an angle'], ['Downward', 'angles down'], ['L-shape', 'forward then up'], ['Wave', 'wiggly wave'], ['Scythe', 'a big curved blade'], ['Broom', 'spreads at the tip'], ['Knot', 'a loop in the middle'], ['Glasses', 'two loops'], ['Star', 'a star at the tip'], ['Square wave', 'boxy wave'], ['Backward', 'reaches backward']],
    leg: [['Pole', 'long and straight'], ['Stub', 'short'], ['Ring', 'a round ring'], ['Boot', 'down then forward'], ['Cane', 'curls at the tip'], ['Zigzag', 'jagged'], ['S-shape', 'a wiggly S'], ['Slant', 'angled forward'], ['T-shape', 'a bar at the tip'], ['Swirl', 'a spiral'], ['Half circle', 'half a circle'], ['Square wave', 'boxy wave'], ['Y-shape', 'splits in two'], ['Big ring', 'short stick, big ring'], ['Knee', 'bent in a V'], ['Square', 'a square frame'], ['Triangle', 'a triangle frame'], ['Bone', 'bumps at both ends'], ['Claw', '3 claws at the tip'], ['Star', 'a star at the tip']],
  };
  if (window.EVENT_PARTS) for (const k of Object.keys(EVN)) (EVENT_PARTS[k] || []).forEach((x, i) => { const e = EVN[k][i]; if (e) { x.name = e[0]; x.hint = e[1]; } });

  // ---- 画面に 出る ところで 置きかえ ----
  const wrap = (proto, prop) => {
    const d = Object.getOwnPropertyDescriptor(proto, prop); if (!d || !d.set) return;
    // なまえ（プレイヤーが つけた もの）は そのまま
    Object.defineProperty(proto, prop, { configurable: true, enumerable: d.enumerable, get: d.get, set(v) { d.set.call(this, this.classList && (this.classList.contains('rk-name') || this.classList.contains('rk-opp') || this.classList.contains('nk-raw')) ? v : tr(v)); } });
  };
  wrap(Node.prototype, 'textContent');
  wrap(Element.prototype, 'innerHTML');
  wrap(HTMLTextAreaElement.prototype, 'value');
  const C = CanvasRenderingContext2D.prototype;
  for (const f of ['fillText', 'strokeText', 'measureText']) { const o = C[f]; C[f] = function (t, ...a) { return o.call(this, tr(String(t)), ...a); }; }
  const cText = document.createTextNode.bind(document);
  document.createTextNode = t => cText(tr(String(t)));
  if (navigator.share) { const s = navigator.share.bind(navigator); navigator.share = o => s(o && o.text ? Object.assign({}, o, { text: tr(o.text) }) : o); }

  // ---- はじめから ある 画面（index.html）----
  function walk(el) {
    for (const ch of Array.from(el.children)) {
      if (ch.tagName === 'SCRIPT' || ch.tagName === 'STYLE') continue;
      const k = norm(ch.innerHTML);
      if (JP.test(k) && Dn[k] != null) { ch.innerHTML = Dn[k]; continue; }
      walk(ch);
    }
    for (const n of Array.from(el.childNodes)) if (n.nodeType === 3 && JP.test(n.nodeValue)) { const t = tr(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
  }
  walk(document.body);
  for (const el of document.querySelectorAll('[placeholder],[aria-label]')) {
    for (const a of ['placeholder', 'aria-label']) { const v = el.getAttribute(a); if (v && JP.test(v)) el.setAttribute(a, tr(v)); }
  }
  document.title = 'Draw! Monster Battle';
})();
