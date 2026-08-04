# STCraft 服务器官网

STCraft Minecraft 生存服务器的官方网站，纯静态页面（HTML + CSS + JS），无任何构建步骤，
推送到 GitHub 后由 Cloudflare Pages 自动部署。

线上地址：<https://www.stcraft.cc>

## 目录结构

```
web/
├── public/                 # 网站根目录（Cloudflare Pages 的构建输出目录就填它）
│   ├── index.html          # 主页
│   ├── 404.html            # 404 页面
│   ├── robots.txt
│   ├── css/style.css       # 全部样式
│   ├── images/favicon.svg  # 草方块图标
│   └── js/
│       ├── config.js       # ★ 网站配置：服务器地址、QQ 群、管理团队等，改这里就行
│       └── main.js         # 交互：状态查询、复制按钮、导航等
└── README.md
```

## 修改网站内容

- **服务器地址 / QQ 群 / 管理成员 / 版本号**：编辑 `public/js/config.js`。
- **页面文案（特色、玩法、规则、FAQ 等）**：直接编辑 `public/index.html`。
- **样式 / 配色**：编辑 `public/css/style.css`（顶部 CSS 变量即可换主题色）。

## 本地预览

```bash
cd web/public
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080
```

> 复制按钮依赖安全上下文，本地 `localhost` 可以正常使用。

## 功能说明

| 功能 | 实现方式 |
| --- | --- |
| 实时在线状态 / 人数 / 版本 | 调用免费接口 `api.mcsrvstat.us`（每 60 秒刷新），要求服务器对外可访问（已配 SRV 记录，直接查询 `stcraft.cc`） |
| 复制地址 / 复制命令 | Clipboard API + 降级方案 |
| 管理团队头像 | cravatar.cn 头像接口，失败自动降级 mc-heads.net |
| 移动端适配 | 响应式布局 + 折叠导航 |

## 部署：GitHub + Cloudflare Pages（自动部署）

### 1. 推送到 GitHub

```bash
cd web
git add .
git commit -m "init: STCraft 官网"

# 在 GitHub 上新建一个仓库（例如 stcraft-website），然后：
git remote add origin git@github.com:<你的用户名>/stcraft-website.git
git push -u origin main
```

### 2. 在 Cloudflare 创建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) →
   **Workers & Pages** → **Create** → 选择 **Pages** 标签 → **Connect to Git**。
2. 授权 GitHub（首次需要），选择刚推送的仓库。
3. 构建设置：
   - **Project name**：`stcraft-website`（会成为默认域名前缀）
   - **Production branch**：`main`
   - **Framework preset**：`None`
   - **Build command**：留空
   - **Build output directory**：`public`
4. 点击 **Save and Deploy**，几十秒后即完成首次部署。

之后每次 `git push` 到 `main` 分支，Cloudflare 都会自动重新部署；
推送到其他分支会生成预览链接，方便改动前预览。

### 3. 绑定自定义域名 www.stcraft.cc

Pages 项目 → **Custom domains** → **Set up a custom domain**，填入 `www.stcraft.cc`。
若域名已在 Cloudflare 托管 DNS，会自动配置解析和 HTTPS 证书，几分钟内生效。
建议同时绑定 `stcraft.cc`（根域名），Cloudflare 会自动处理跳转。

> 注意：`stcraft.cc` 的 SRV 记录（指向服务器 24993 端口）与网站解析互不影响，
> SRV 记录只影响游戏进服，不影响网站访问。

## 许可证

页面内容自由使用。Minecraft 相关版权归 Mojang Studios / Microsoft 所有。
