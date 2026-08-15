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

  fetch('data_enchants.json')
    .then(res => res.json())
    .then(data => {
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
    })
    .catch(err => console.error("Error loading enchants data:", err));
});
