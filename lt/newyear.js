document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
      menuToggle.setAttribute('aria-expanded', !expanded);
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. FAQ Accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });
      item.classList.toggle('active', !isActive);
    });
  });

  // 2.5 Grade Message Accordion Toggle
  const gradeItems = document.querySelectorAll('.grade-toggle-item');
  const gradeExpandAll = document.getElementById('gradeExpandAll');
  const gradeCollapseAll = document.getElementById('gradeCollapseAll');

  gradeItems.forEach(item => {
    const headerBtn = item.querySelector('.grade-toggle-header');
    if (headerBtn) {
      headerBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        item.classList.toggle('active', !isActive);
        headerBtn.setAttribute('aria-expanded', !isActive);
      });
    }
  });

  if (gradeExpandAll) {
    gradeExpandAll.addEventListener('click', () => {
      gradeItems.forEach(item => {
        item.classList.add('active');
        const btn = item.querySelector('.grade-toggle-header');
        if (btn) btn.setAttribute('aria-expanded', 'true');
      });
    });
  }

  if (gradeCollapseAll) {
    gradeCollapseAll.addEventListener('click', () => {
      gradeItems.forEach(item => {
        item.classList.remove('active');
        const btn = item.querySelector('.grade-toggle-header');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2.6 Slide Structure Template Toggle
  const slideTemplateBox = document.getElementById('slide-template');
  const slideTemplateToggle = document.getElementById('slideTemplateToggle');
  if (slideTemplateBox && slideTemplateToggle) {
    slideTemplateToggle.addEventListener('click', () => {
      const isActive = slideTemplateBox.classList.toggle('active');
      slideTemplateToggle.setAttribute('aria-expanded', isActive);
      const label = slideTemplateToggle.querySelector('.slide-toggle-label');
      if (label) {
        label.textContent = isActive ? '構成を閉じる ▲' : 'スライド構成を見る ▼';
      }
    });
  }

  // Page Tabs - About/Grades
  const nyTabSection = document.getElementById('about');
  const nyTabBtns = document.querySelectorAll('#about .page-tab-btn');
  const nyTabPanels = document.querySelectorAll('#about .page-tab-panel');

  function activateNyTab(tabId) {
    nyTabBtns.forEach(btn => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active);
    });
    nyTabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  nyTabBtns.forEach(btn => {
    btn.addEventListener('click', () => activateNyTab(btn.dataset.tab));
  });

  const nyTabMap = { '#about': 'ny-tab-about', '#grades': 'ny-tab-grades' };
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (nyTabMap[href]) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        activateNyTab(nyTabMap[href]);
        if (nyTabSection) nyTabSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', href);
      });
    }
  });

  const nyInitHash = window.location.hash;
  if (nyInitHash && nyTabMap[nyInitHash]) {
    activateNyTab(nyTabMap[nyInitHash]);
  }

  // 3. New Year LT Omikuji (おみくじ - 全20種 ＆ モーダルポップアップ)
  const omikujiBtn = document.getElementById('omikujiBtn');
  const omikujiModal = document.getElementById('omikujiModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalRerollBtn = document.getElementById('modalRerollBtn');
  const modalEntryBtn = document.getElementById('modalEntryBtn');

  const modalBadge = document.getElementById('modalBadge');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDesc');
  const modalHintTitle = document.getElementById('modalHintTitle');
  const modalHintAdvice = document.getElementById('modalHintAdvice');
  const modalLuckyBox = document.getElementById('modalLuckyBox');

  const omikujiResults = [
    {
      badge: '🎍 超大吉',
      title: '『2027年、GitHubの草が全面深緑＆個人開発が大ヒット！』',
      desc: '冬休みに思いついたアイデアを最速で形にしてLTで発表しよう！オフィスのみんなが最初のファンになります。',
      hintTitle: '『冬休みの3日間で個人開発アプリを爆速ローンチした話』',
      hintAdvice: '「なぜ作ったか → 選定技術（Next.js/Supabase） → 苦労した点 → 実機デモ」の流れで画面を見せながら話すと大好評間違いなし！',
      tech: 'Next.js / Supabase / Vercel',
      item: '好きなお菓子・チョコ 🍫'
    },
    {
      badge: '🌅 大大吉',
      title: '『ハッカソン最優秀賞＆チーム開発の伝説へ』',
      desc: '奇跡的なアイデアが閃く年！技術の引き出しを広げるために、新春LTで仲間を募ろう。',
      hintTitle: '『生成AI（Claude / ChatGPT）を活用してハッカソンに出てみた振り返り』',
      hintAdvice: '「アイデア出しでAIをどう使ったか」「生じたトラブル」「得られた学び」を共有するとチーム開発の参考になります。',
      tech: 'FastAPI / Flutter / Claude API',
      item: 'エナジードリンク ⚡'
    },
    {
      badge: '🌺 大吉',
      title: '『難解なバグが夢の中で自己解決する神がかりな1年』',
      desc: '「3時間溶かしたあのエラーの原因」をLTで話すと、会場全員から「わかる〜！」と大共感されます。',
      hintTitle: '『3時間溶かした難解エラーの原因が◯◯だった件について』',
      hintAdvice: 'エラー画面やログのキャプチャを貼って「ここが原因でした！」とオチをつけるだけで会場全体が一体感に包まれます。',
      tech: 'TypeScript / Docker / Vitest',
      item: 'こまめな水分補給 💧'
    },
    {
      badge: '🎉 大吉',
      title: '『初登壇で会場全体から拍手喝采を浴びる兆し！』',
      desc: '「触ってみた」だけでOK！1〜2年生の瑞々しい視点こそが、先輩たちにとっても最大の刺激になります。',
      hintTitle: '『学部1年生の僕が初めてPythonでスクレイピングしてみた記録』',
      hintAdvice: '初心者ならではの「どこで躓いて、どうやって解決したか」は同じ初学者にとっても先輩にとっても最高のトークテーマです。',
      tech: 'Python / HTML・CSS / GitHub',
      item: 'スライド数枚のメモ 📝'
    },
    {
      badge: '⌨️ 大吉',
      title: '『憧れの自作キーボードが奇跡の一発動作！打鍵音で無双』',
      desc: 'コトコト音でコーディング効率が3倍に。「私のこだわりデスク環境」をLTで見せ合おう！',
      hintTitle: '『自作キーボード入門！自分好みの打鍵感を求めた沼の記録』',
      hintAdvice: 'キット選び、はんだ付け、キースイッチの比較などを実物写真付きで紹介！打鍵音をマイクで聞かせるのもウケます。',
      tech: '自作キーボード / デスク環境構築',
      item: 'お気に入りのキースイッチ ⌨️'
    },
    {
      badge: '🚀 大吉',
      title: '『推しフレームワークのメジャーアップデートで神機能が追加』',
      desc: '公式ドキュメントをいち早く読んでLTで速報しよう！サークル内の第一人者になれます。',
      hintTitle: '『React 19 / Nuxt 4 の新機能を最速で触って分かった注目ポイント』',
      hintAdvice: '公式ドキュメントの要約＋「実際にコード動かしてみた」の所感を2〜3点に絞ってテンポよく紹介するとスマートです。',
      tech: 'React 19 / Nuxt 4 / Tailwind CSS',
      item: '公式ドキュメント 📖'
    },
    {
      badge: '✨ 中吉',
      title: '『GitHubの草が途切れることなく青々と繁茂する年』',
      desc: '毎日の小さなコミットが大きな自信に。日々の学習ログやObsidian活用術をシェアしよう！',
      hintTitle: '『GitHub草を生やし続けるための無理のない習慣化ハック』',
      hintAdvice: '毎朝5分の小さなコミット術や、学習メモ・読書ログのリポジトリ活用術を共有すると共感を呼びます。',
      tech: 'Git / GitHub Actions / CI/CD',
      item: '草を生やす習慣 🌱'
    },
    {
      badge: '🎯 中吉',
      title: '『自分にジャストフィットする最強のエディタ設定に出会う』',
      desc: '「私のVS Code神拡張機能3選」やNeovim設定はLT会の鉄板人気テーマ！',
      hintTitle: '『私のVS Code・Cursorを最強にする激推し拡張機能BEST 3』',
      hintAdvice: '実際に使っている画面をエディタで映しながらショートカットや動作を実演すると一気に引き込まれます。',
      tech: 'Neovim / VS Code / Cursor',
      item: '等幅プログラミングフォント 🔤'
    },
    {
      badge: '🐧 中吉',
      title: '『Linuxコマンドを完全にマスターして「黒い画面」の魔術師に』',
      desc: 'ターミナルを自在に操る快感！シェルスクリプトで自動化した日常タスクを発表しよう。',
      hintTitle: '『脱・黒い画面恐怖症！知っておくと作業が爆速になるシェル技』',
      hintAdvice: 'cd / ls / grep / find / alias の便利技など、「これ早く知りたかった！」というコマンドを紹介！',
      tech: 'Zsh / tmux / Shell Script',
      item: 'コマンドチートシート 📜'
    },
    {
      badge: '🤝 中吉',
      title: '『チーム開発でGitコンフリクトを1秒で解決してヒーローになる』',
      desc: '冷静沈着なマージさばきに後輩が憧れの眼差し。「Gitで詰まらないコツ」を共有しよう！',
      hintTitle: '『チーム開発の鬼門「Gitコンフリクト」を恐れなくなる処方箋』',
      hintAdvice: 'コンフリクトが起きる原理と、VS CodeやGitHubのGUIを使った優しい解消ステップを図解すると重宝されます。',
      tech: 'Git Rebase / Pull Request',
      item: '退避用バックアップブランチ 🌿'
    },
    {
      badge: '🍪 お菓子吉',
      title: '『オフィスのお菓子コーナーで推しの銘菓を発見する幸運』',
      desc: '糖分補給でバグが一瞬で解決！「お菓子とプログラミングの因果関係」で5分喋れるかも！？',
      hintTitle: '『糖分とコーディング効率の科学〜お菓子で乗り切る開発合宿〜』',
      hintAdvice: '「チョコ派 vs グミ派」「深夜開発に効くお菓子ランキング」など、ゆるくて楽しいライトなネタで場を和ませましょう！',
      tech: '糖分補給 & モチベーション管理',
      item: 'オフィスのお菓子 🍪'
    },
    {
      badge: '⚡ 飛び入り吉',
      title: '『当日の直感で飛び入り登壇したら会場が一番盛り上がった！』',
      desc: '準備ゼロ、画面共有1枚で喋るリアルタイム感が最高！「今週触ったこれ」をサクッと話そう。',
      hintTitle: '『【飛び入り】今週見つけた激アツなWebツール・ライブラリ紹介』',
      hintAdvice: 'スライド不要！ブラウザのタブを開いて「これめっちゃ良くないですか？」と見せるだけで5分LTが成立します。',
      tech: 'ライブデモ / 画面共有',
      item: '発表する勇気 ✨'
    },
    {
      badge: '🤖 AI吉',
      title: '『プロンプト1行で思い通りの実装が一撃で完成する奇跡』',
      desc: 'AIペアプロで開発爆速化！「AIにここまで作らせてみた実験記録」は誰もが聞きたいネタです。',
      hintTitle: '『プロンプト一発でここまで出来た！生成AI駆動開発の実力検証』',
      hintAdvice: '実際にAIに出した指示文（プロンプト）と、出力されたコードのクオリティを比較レビュー！',
      tech: 'ChatGPT / Claude / GitHub Copilot',
      item: '的確なシステムプロンプト 🤖'
    },
    {
      badge: '💡 小吉',
      title: '『3日悩んだバグの原因が「全角スペース」だった奇跡』',
      desc: 'やらかし失敗談はLT会のごちそう！笑いに変えて成仏させれば、今年の運気は爆上がりです。',
      hintTitle: '『なぜ私のコードは動かなかったのか？伝説のやらかしバグ供養会』',
      hintAdvice: '「全角スペース」「セミコロン忘れ」「環境変数のスペルミス」など、エンジニアなら誰もが通る道を笑いに変えよう！',
      tech: 'Linter / フォーマッター設定',
      item: 'エディタの不可視文字表示 👀'
    },
    {
      badge: '📚 小吉',
      title: '『積読していた分厚い技術書が突然スラスラ読める覚醒期到来』',
      desc: '買ったきり本棚に眠っていた名著を開いてみよう。「この本のここが面白かった」で1本LT完成！',
      hintTitle: '『積読を脱出！冬休みに読んだ技術書「◯◯」のここが凄かった』',
      hintAdvice: '本の全容を語るのではなく「一番目からウロコだった1つの考え方」に絞って熱く語るのがポイントです。',
      tech: '輪読会・技術書インプット',
      item: 'オライリー本 📘'
    },
    {
      badge: '☕ 吉',
      title: '『ゆるく楽しく、気づけば技術力が格段に向上している年』',
      desc: '無理せず自分のペースで。「2027年に挑戦したいこと宣言」を5分語れば、一緒に学ぶ仲間が見つかります。',
      hintTitle: '『2027年、私が絶対にマスターしたい技術スタック宣言！』',
      hintAdvice: '「なぜその言語・ツールをやりたいか」「どんなプロダクトを作りたいか」を語れば、オフィスで仲間が応援してくれます！',
      tech: '自分の好きな言語・ツール',
      item: '温かいコーヒー ☕'
    },
    {
      badge: '📱 吉',
      title: '『推しガジェットを購入してQOLが爆上がりする予感』',
      desc: 'モニターアーム、トラックボール、ノイズキャンセリングヘッドホン自慢はLTで必ずウケます！',
      hintTitle: '『買ってよかった！エンジニア学生のQOLを劇的に上げたデスクグッズ』',
      hintAdvice: 'モニターアーム、トラックボール、PCスタンド、タイマーなどのビフォーアフターを写真で紹介！',
      tech: '生産性向上ガジェット',
      item: 'トラックボールマウス 🖱️'
    },
    {
      badge: '🍀 末吉',
      title: '『環境構築で半日溶かすも、OSの仕組みに詳しくなって結果オーライ！』',
      desc: 'ハマった分だけ血肉になる！「WSLやDockerで詰まったポイント」を後輩のために共有しよう。',
      hintTitle: '『Docker / WSL2 環境構築で盛大にハマって学んだLinuxの基礎』',
      hintAdvice: '詰まったエラーメッセージとググり方、解決までの思考プロセスを整理して「同じ轍を踏まないためのメモ」に！',
      tech: 'Docker / WSL2 / Homebrew',
      item: 'エラーログのコピペ 📋'
    },
    {
      badge: '🌸 学業吉',
      title: '『プログラミングに熱中しすぎて単位が危うくなるも無事フル単！』',
      desc: '大学の講義とサークル開発の両立は永遠のテーマ。「私の時間割＆課題管理術」をシェア！',
      hintTitle: '『サークル開発と講義課題を両立する！私のNotionタスク管理術』',
      hintAdvice: '締切管理やレポート執筆、時間割との付き合い方を実際のNotionテンプレート画面で見せてみよう！',
      tech: 'Notion / Googleカレンダー連携',
      item: '単位への執念 🎓'
    },
    {
      badge: '💎 つよつよ吉',
      title: '『先輩から「君、最近急にコード書けるようになったね」と褒められる』',
      desc: 'アウトプットこそ最大の成長アクセラレータ。新春LTでの1回の登壇がブレイクスルーの契機に！',
      hintTitle: '『「動けばいいコード」から卒業！読みやすいコードを書く3つの工夫』',
      hintAdvice: '変数名の付け方、早期リターン、関数の分割など、ちょっとしたリファクタリングの前後（Before / After）を提示！',
      tech: 'Clean Architecture / リファクタリング',
      item: '先輩からの褒め言葉 🌟'
    }
  ];

  function showOmikujiResult() {
    const randomIndex = Math.floor(Math.random() * omikujiResults.length);
    const result = omikujiResults[randomIndex];

    if (modalBadge) modalBadge.textContent = result.badge;
    if (modalTitle) modalTitle.textContent = result.title;
    if (modalDesc) modalDesc.textContent = result.desc;
    if (modalHintTitle) modalHintTitle.textContent = result.hintTitle;
    if (modalHintAdvice) modalHintAdvice.textContent = result.hintAdvice;

    if (modalLuckyBox && result.tech && result.item) {
      modalLuckyBox.innerHTML = `
        <span class="lucky-tag"><strong>推し技術:</strong> ${result.tech}</span>
        <span class="lucky-tag"><strong>ラッキーアイテム:</strong> ${result.item}</span>
      `;
    }
  }

  function openOmikujiModal() {
    showOmikujiResult();
    if (omikujiModal) {
      omikujiModal.classList.add('is-open');
      omikujiModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; // 背景スクロール固定
    }
  }

  function closeOmikujiModal() {
    if (omikujiModal) {
      omikujiModal.classList.remove('is-open');
      omikujiModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (omikujiBtn) {
    omikujiBtn.addEventListener('click', openOmikujiModal);
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeOmikujiModal);
  }

  if (modalRerollBtn) {
    modalRerollBtn.addEventListener('click', () => {
      modalRerollBtn.disabled = true;
      modalRerollBtn.textContent = '抽選中...';
      setTimeout(() => {
        showOmikujiResult();
        modalRerollBtn.disabled = false;
        modalRerollBtn.textContent = 'もう一度引く 🎍';
      }, 250);
    });
  }

  if (modalEntryBtn) {
    modalEntryBtn.addEventListener('click', () => {
      closeOmikujiModal();
    });
  }

  // 背景クリックでモーダルを閉じる
  if (omikujiModal) {
    omikujiModal.addEventListener('click', (e) => {
      if (e.target === omikujiModal) {
        closeOmikujiModal();
      }
    });
  }

  // Escキーでモーダルを閉じる
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && omikujiModal && omikujiModal.classList.contains('is-open')) {
      closeOmikujiModal();
    }
  });
});
