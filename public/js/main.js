/* ============================================================
   STCraft 官网交互脚本
   - 填充服务器地址 / 管理团队
   - mcsrvstat.us 实时状态查询（每 60 秒刷新）
   - 复制地址 / 复制命令
   - 移动端导航
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.SITE_CONFIG || {};

  function $(id) {
    return document.getElementById(id);
  }

  /* ---------- 基础信息填充 ---------- */

  var address = (cfg.serverAddress || "").trim();
  var addressConfigured = address.length > 0 && address.indexOf("待配置") === -1;

  [$("serverAddress"), $("serverAddressGuide")].forEach(function (el) {
    if (el) el.textContent = addressConfigured ? address : "地址待配置（请编辑 js/config.js）";
  });

  if ($("maxPlayers")) $("maxPlayers").textContent = cfg.maxPlayers || "-";
  if ($("year")) $("year").textContent = String(new Date().getFullYear());

  /* ---------- QQ 群 ---------- */

  var qqWrap = $("heroContact");
  if (qqWrap) {
    if (cfg.qqGroup) {
      var qqNumEl = $("qqGroup");
      if (qqNumEl) qqNumEl.textContent = cfg.qqGroup;
      var qqLinkEl = $("qqGroupLink");
      if (qqLinkEl && cfg.qqGroupUrl) qqLinkEl.href = cfg.qqGroupUrl;
    } else {
      qqWrap.style.display = "none";
    }
  }

  var footerContact = $("footerContact");
  if (footerContact && cfg.qqGroup) {
    footerContact.textContent = "QQ群：" + cfg.qqGroup;
    if (cfg.qqGroupUrl) {
      var contactA = document.createElement("a");
      contactA.href = cfg.qqGroupUrl;
      contactA.target = "_blank";
      contactA.rel = "noopener";
      contactA.textContent = "（点击加入）";
      footerContact.appendChild(contactA);
    }
  }

  /* ---------- Toast 提示 ---------- */

  var toastEl = document.createElement("div");
  toastEl.className = "toast";
  document.body.appendChild(toastEl);
  var toastTimer = null;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 1800);
  }

  /* ---------- 复制功能 ---------- */

  function copyText(text, onDone) {
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        onDone(true);
      } catch (e) {
        onDone(false);
      }
      document.body.removeChild(ta);
    }

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { onDone(true); },
        function () { fallback(); }
      );
    } else {
      fallback();
    }
  }

  var copyBtn = $("copyAddressBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      if (!addressConfigured) {
        toast("服务器地址尚未配置");
        return;
      }
      copyText(address, function (ok) {
        toast(ok ? "已复制服务器地址 ✔" : "复制失败，请手动复制");
      });
    });
  }

  var addressBox = document.querySelector(".address-box");
  if (addressBox) {
    addressBox.addEventListener("click", function () {
      if (!addressConfigured) return;
      copyText(address, function (ok) {
        toast(ok ? "已复制服务器地址 ✔" : "复制失败，请手动复制");
      });
    });
  }

  document.querySelectorAll(".btn-copy").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy-text");
      if (!text) {
        var target = $(btn.getAttribute("data-copy-target"));
        text = target ? target.textContent.trim() : "";
      }
      if (!text) return;
      copyText(text, function (ok) {
        if (ok) {
          btn.classList.add("copied");
          btn.textContent = "已复制";
          setTimeout(function () {
            btn.classList.remove("copied");
            btn.textContent = "复制";
          }, 1600);
        } else {
          toast("复制失败，请手动复制");
        }
      });
    });
  });

  /* ---------- 实时状态查询 ---------- */

  var dotEl = $("statusDot");
  var statusTextEl = $("statusText");
  var onlineEl = $("onlinePlayers");
  var versionEl = $("serverVersion");

  function setStatus(state, text) {
    if (!dotEl || !statusTextEl) return;
    dotEl.classList.remove("online", "offline");
    if (state) dotEl.classList.add(state);
    statusTextEl.textContent = text;
  }

  function applyStatus(data) {
    if (data && data.online) {
      setStatus("online", "在线");
      var players = data.players || {};
      if (onlineEl) onlineEl.textContent = String(players.online != null ? players.online : "-");
      if ($("maxPlayers")) $("maxPlayers").textContent = String(players.max || cfg.maxPlayers || "-");
      if (versionEl) versionEl.textContent = data.version || cfg.version || "-";
    } else {
      setStatus("offline", "离线");
      if (onlineEl) onlineEl.textContent = "0";
      if (versionEl) versionEl.textContent = cfg.version || "-";
    }
  }

  function refreshStatus() {
    if (!addressConfigured) {
      setStatus(null, "地址未配置");
      if (versionEl) versionEl.textContent = cfg.version || "-";
      return;
    }
    var api = "https://api.mcsrvstat.us/3/" + encodeURIComponent(cfg.statusAddress || address);
    fetch(api)
      .then(function (res) { return res.json(); })
      .then(applyStatus)
      .catch(function () {
        setStatus("offline", "查询失败");
        if (versionEl) versionEl.textContent = cfg.version || "-";
      });
  }

  refreshStatus();
  setInterval(refreshStatus, 60 * 1000);

  /* ---------- 导航 ---------- */

  var navToggle = $("navToggle");
  var navLinks = $("navLinks");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinks.classList.remove("open");
      });
    });
  }

  var navBar = document.querySelector(".nav");
  window.addEventListener("scroll", function () {
    if (!navBar) return;
    navBar.classList.toggle("scrolled", window.scrollY > 10);
  }, { passive: true });

  /* ---------- 管理团队头像 ---------- */

  var teamWrap = $("teamAvatars");
  if (teamWrap && Array.isArray(cfg.team)) {
    var apiTemplate = cfg.avatarApi || "https://cravatar.cn/avatar/{name}/64.png";
    cfg.team.forEach(function (name) {
      var member = document.createElement("div");
      member.className = "team-member";

      var img = document.createElement("img");
      img.alt = name;
      img.width = 48;
      img.height = 48;
      img.loading = "lazy";
      img.src = apiTemplate.replace("{name}", encodeURIComponent(name));
      img.addEventListener("error", function () {
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = "https://mc-heads.net/avatar/" + encodeURIComponent(name) + "/48";
        } else {
          img.remove();
        }
      });

      var label = document.createElement("span");
      label.textContent = name;

      member.appendChild(img);
      member.appendChild(label);
      teamWrap.appendChild(member);
    });
  }
})();


// ============ 自定义附魔数据加载与渲染 ============
document.addEventListener('DOMContentLoaded', () => {
  const enchantTabs = document.getElementById('enchantTabs');
  const enchantContent = document.getElementById('enchantContent');
  
  if (!enchantTabs || !enchantContent) return;

  const data = [
  {
    "category": "武器类（16个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "冰霜方面",
        "ice_aspect",
        "10",
        "等级×1% → 上限10%",
        "击中时冻结并施加冰冻效果"
      ],
      [
        "火焰护盾",
        "fire_shield",
        "10",
        "等级×1% → 上限10%",
        "几率使攻击者着火"
      ],
      [
        "冷钢",
        "cold_steel",
        "10",
        "等级×1% → 上限10%",
        "几率对攻击者施加冰冻效果"
      ],
      [
        "双重打击",
        "double_strike",
        "10",
        "等级×1% → 上限10%",
        "几率造成双倍伤害"
      ],
      [
        "凋零",
        "wither",
        "1",
        "等级×1% → 上限10%",
        "几率对目标施加凋零效果"
      ],
      [
        "剧毒",
        "venom",
        "10",
        "等级×1% → 上限10%",
        "几率对目标施加中毒效果"
      ],
      [
        "混乱",
        "confusion",
        "10",
        "等级×1% → 上限10%",
        "几率对目标施加混乱效果"
      ],
      [
        "致盲",
        "blindness",
        "10",
        "等级×1% → 上限10%",
        "几率对目标施加失明效果"
      ],
      [
        "精疲力竭",
        "exhaust",
        "10",
        "等级×1% → 上限10%",
        "几率对目标施加疲劳效果"
      ],
      [
        "麻痹",
        "paralyze",
        "10",
        "等级×1% → 上限10%",
        "几率对目标施加麻痹效果"
      ],
      [
        "狂怒",
        "rage",
        "10",
        "等级×1% → 上限10%",
        "几率获得力量效果"
      ],
      [
        "雷霆",
        "thunder",
        "10",
        "等级×1% → 上限10%",
        "几率召唤闪电攻击敌人"
      ],
      [
        "淬火",
        "temper",
        "10",
        "—",
        "生命值越低伤害越高（每级+5%）"
      ],
      [
        "斩首者",
        "decapitator",
        "10",
        "等级×1% → 上限10%",
        "几率获得玩家或生物头颅"
      ],
      [
        "下界克星",
        "bane_of_netherspawn",
        "10",
        "—",
        "对下界生物造成额外伤害（每级+1）"
      ],
      [
        "村庄守护者",
        "village_defender",
        "10",
        "—",
        "对掠夺者造成额外伤害（每级+0.5）"
      ]
    ]
  },
  {
    "category": "远程武器类（14个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "爆炸之箭",
        "explosive_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射爆炸箭"
      ],
      [
        "黑暗之箭",
        "darkness_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射带有黑暗效果的箭"
      ],
      [
        "淬毒之箭",
        "poisoned_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射带有中毒效果的箭"
      ],
      [
        "迷惑之箭",
        "confusing_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射带有迷惑效果的箭"
      ],
      [
        "悬停",
        "hover",
        "10",
        "等级×1% → 上限10%",
        "几率发射带有悬浮效果的箭"
      ],
      [
        "雷电之箭",
        "electrified_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射带电箭造成额外伤害"
      ],
      [
        "龙焰之箭",
        "dragonfire_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射龙焰之箭"
      ],
      [
        "凋零之箭",
        "withered_arrows",
        "10",
        "等级×1% → 上限10%",
        "几率发射带有凋零效果的箭"
      ],
      [
        "吸血之箭",
        "vampiric_arrows",
        "10",
        "等级×1% → 上限10%",
        "箭矢命中时几率恢复生命值"
      ],
      [
        "照明弹",
        "flare",
        "10",
        "等级×1% → 上限10%",
        "几率在箭矢着陆处创建火把"
      ],
      [
        "轰炸者",
        "bomber",
        "10",
        "等级×1% → 上限10%",
        "几率发射一枚已点燃的TNT"
      ],
      [
        "恶魂",
        "ghast",
        "10",
        "等级×1% → 上限10%",
        "射出火球代替箭矢"
      ],
      [
        "末影之弓",
        "ender_bow",
        "10",
        "等级×1% → 上限10%",
        "射出末影珍珠代替箭矢"
      ],
      [
        "狙击手",
        "sniper",
        "10",
        "等级×1% → 上限10%",
        "增加弹射物速度"
      ]
    ]
  },
  {
    "category": "防具类（5个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "冰霜护盾",
        "ice_shield",
        "1",
        "等级×1% → 上限10%",
        "几率冻结并对攻击者施加效果"
      ],
      [
        "黑暗斗篷",
        "darkness_cloak",
        "1",
        "等级×1% → 上限10%",
        "被攻击时几率对攻击者施加效果"
      ],
      [
        "止动力",
        "stopping_force",
        "10",
        "等级×1% → 上限10%",
        "几率抵抗击退效果"
      ],
      [
        "烈焰行者",
        "flame_walker",
        "10",
        "—",
        "可以在岩浆上行走（每级+1半径/+1秒持续）"
      ],
      [
        "反弹",
        "rebound",
        "10",
        "—",
        "在粘液块上着陆的效果（每级弹力+0.1）"
      ]
    ]
  },
  {
    "category": "饰品类（2个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "吸血鬼",
        "vampire",
        "10",
        "等级×1% → 上限10%",
        "攻击时几率恢复生命值"
      ],
      [
        "智慧",
        "wisdom",
        "10",
        "—",
        "生物掉落经验值增加（每级+0.5倍）"
      ]
    ]
  },
  {
    "category": "农业/钓鱼类（5个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "双倍收获",
        "double_catch",
        "10",
        "等级×1% → 上限10%",
        "几率将钓鱼收获翻倍"
      ],
      [
        "生存主义者",
        "survivalist",
        "10",
        "等级×1% → 上限10%",
        "钓到生鱼时自动烹饪"
      ],
      [
        "自动补种",
        "replanter",
        "10",
        "—",
        "收获时自动重新种植作物"
      ],
      [
        "老练渔夫",
        "seasoned_angler",
        "10",
        "—",
        "增加钓鱼经验获取量（每级+50%）"
      ],
      [
        "河流大师",
        "river_master",
        "10",
        "—",
        "增加抛竿距离（每级+0.25倍）"
      ]
    ]
  },
  {
    "category": "诅咒类（6个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "死亡诅咒",
        "curse_of_death",
        "10",
        "等级×1% → 上限10%",
        "击杀玩家时你也有几率死亡"
      ],
      [
        "破坏诅咒",
        "curse_of_breaking",
        "1",
        "等级×1% → 上限10%",
        "几率消耗额外耐久度点数"
      ],
      [
        "平庸诅咒",
        "curse_of_mediocrity",
        "10",
        "等级×1% → 上限10%",
        "几率解除物品掉落的附魔"
      ],
      [
        "不幸诅咒",
        "curse_of_misfortune",
        "10",
        "等级×1% → 上限10%",
        "几率无法获得掉落物"
      ],
      [
        "溺亡诅咒",
        "curse_of_drowned",
        "10",
        "等级×1% → 上限10%",
        "几率钓到一个溺尸"
      ],
      [
        "脆弱诅咒",
        "curse_of_fragility",
        "1",
        "—",
        "防止物品被砂轮或铁砧处理"
      ]
    ]
  },
  {
    "category": "特殊类（16个）",
    "headers": [
      "附魔名称",
      "英文ID",
      "最大等级",
      "触发概率",
      "效果"
    ],
    "rows": [
      [
        "偷窃者",
        "swiper",
        "10",
        "等级×1% → 上限10%",
        "几率从玩家那里偷取经验值"
      ],
      [
        "神风特攻",
        "kamikadze",
        "10",
        "等级×1% → 上限10%",
        "死亡时几率爆炸"
      ],
      [
        "火箭推进",
        "rocket",
        "10",
        "等级×1% → 上限10%",
        "几率将敌人发射到太空中"
      ],
      [
        "治愈",
        "cure",
        "10",
        "等级×1% → 上限10%",
        "几率治愈僵尸猪灵和僵尸村民"
      ],
      [
        "地狱火",
        "infernus",
        "10",
        "—",
        "投出的三叉戟命中时点燃敌人（每级+1秒燃烧）"
      ],
      [
        "跳跃",
        "jumping",
        "10",
        "—",
        "赋予永久跳跃提升效果（每级+1级药水效果）"
      ],
      [
        "念力搬运",
        "telekinesis",
        "10",
        "—",
        "将方块掉落物直接移入背包"
      ],
      [
        "敏捷",
        "nimble",
        "10",
        "—",
        "将怪物掉落物直接移入背包"
      ],
      [
        "熔炼者",
        "smelter",
        "10",
        "—",
        "几率将挖掘的方块自动烧炼"
      ],
      [
        "连锁挖矿",
        "veinminer",
        "1",
        "—",
        "一次挖掘多个矿脉方块"
      ],
      [
        "爆破采矿",
        "blast_mining",
        "10",
        "—",
        "几率通过爆炸挖掘方块"
      ],
      [
        "隧道挖掘",
        "tunnel",
        "1",
        "—",
        "一次挖掘多个方块形成特定形状"
      ],
      [
        "伐木者",
        "treefeller",
        "1",
        "—",
        "砍伐整棵树"
      ],
      [
        "幸运矿工",
        "lucky_miner",
        "10",
        "—",
        "几率从矿石中获得额外经验"
      ],
      [
        "碎玻璃者",
        "glassbreaker",
        "1",
        "—",
        "瞬间破坏玻璃"
      ],
      [
        "轻量化",
        "lightweight",
        "1",
        "—",
        "可以安全踩踏海龟蛋等脆弱方块"
      ]
    ]
  },
  {
    "category": "禁用附魔（17个，无法获取）",
    "headers": [
      "附魔名称",
      "英文ID",
      "效果"
    ],
    "rows": [
      [
        "自动收线",
        "auto_reel",
        "钓鱼成功后自动收线"
      ],
      [
        "钩刀",
        "cutter",
        "特殊攻击技能"
      ],
      [
        "龙之心",
        "dragon_heart",
        "死亡时几率保留经验"
      ],
      [
        "元素防护",
        "elemental_protection",
        "综合元素抗性"
      ],
      [
        "硬化",
        "hardened",
        "增加护甲值"
      ],
      [
        "急迫",
        "haste",
        "增加挖掘速度"
      ],
      [
        "滞留",
        "lingering",
        "药水效果延长"
      ],
      [
        "夜视",
        "night_vision",
        "获得夜视效果"
      ],
      [
        "再生",
        "regrowth",
        "自动恢复生命值"
      ],
      [
        "恢复",
        "restore",
        "恢复经验值"
      ],
      [
        "饱食",
        "saturation",
        "自动恢复饱食度"
      ],
      [
        "精准采集箱子",
        "silk_chest",
        "精准采集带内容的箱子"
      ],
      [
        "精准采集刷怪笼",
        "silk_spawner",
        "精准采集刷怪笼"
      ],
      [
        "灵魂绑定",
        "soulbound",
        "死亡不掉落"
      ],
      [
        "速度",
        "speed",
        "增加移动速度"
      ],
      [
        "节俭",
        "thrifty",
        "减少强化消耗"
      ],
      [
        "水下呼吸",
        "water_breathing",
        "获得水下呼吸效果"
      ]
    ]
  }
];
    
      let activeIndex = 0;
      
      const renderContent = (index) => {
        const categoryData = data[index];
        let html = '<table class="enchant-table"><thead><tr>';
        
        categoryData.headers.forEach(h => {
          html += `<th>${h}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        categoryData.rows.forEach(row => {
          html += '<tr>';
          row.forEach(col => {
            html += `<td>${col}</td>`;
          });
          html += '</tr>';
        });
        
        html += '</tbody></table>';
        enchantContent.innerHTML = html;
        enchantContent.scrollTop = 0;
      };

      data.forEach((cat, idx) => {
        const li = document.createElement('li');
        li.textContent = cat.category;
        if (idx === 0) li.classList.add('active');
        
        li.addEventListener('click', () => {
          document.querySelectorAll('.enchant-tabs li').forEach(el => el.classList.remove('active'));
          li.classList.add('active');
          renderContent(idx);
        });
        
        enchantTabs.appendChild(li);
      });

      if (data.length > 0) {
        renderContent(0);
      }
});


// ============ 模态框交互 ============
document.addEventListener('DOMContentLoaded', () => {
  const modalOverlay = document.getElementById('modalOverlay');
  if (!modalOverlay) return;

  const cards = document.querySelectorAll('.clickable-card');
  const closeBtns = document.querySelectorAll('.modal-close');
  const modals = document.querySelectorAll('.modal-box');

  const closeAllModals = () => {
    modalOverlay.classList.remove('show');
    modals.forEach(m => m.classList.remove('active'));
    document.body.style.overflow = ''; // Restore scrolling
  };

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.getAttribute('data-modal');
      const targetModal = document.getElementById(targetId);
      if (targetModal) {
        closeAllModals();
        targetModal.classList.add('active');
        modalOverlay.classList.add('show');
        // Prevent body scrolling
        // But since the site uses snap scrolling, maybe just standard overflow hidden
        // Actually snap scrolling uses 100vh sections, so body overflow hidden is fine
      }
    });
  });

  closeBtns.forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeAllModals();
    }
  });
});
