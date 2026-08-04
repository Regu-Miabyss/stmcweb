/* ============================================================
   网站配置文件 —— 只需要改这个文件即可更新网站内容
   ============================================================ */
window.SITE_CONFIG = {
  /* 服务器名称 */
  serverName: "STCraft",

  /* 玩家进服使用的地址（已配置 SRV 记录，无需端口） */
  serverAddress: "stcraft.cc",

  /* 状态查询使用的地址（留空则与 serverAddress 一致） */
  statusAddress: "",

  /* 服务端版本（状态接口查询失败时显示的兜底文案） */
  version: "26.2",

  /* 最大玩家数（在线时以查询结果为准） */
  maxPlayers: 20,

  /* QQ 群号（留空 "" 则页面上不显示） */
  qqGroup: "786360709",

  /* QQ 群邀请链接 */
  qqGroupUrl: "https://qm.qq.com/q/NkHbpRPiQa",

  /* 管理团队成员（游戏 ID） */
  team: ["Sheast", "liuxingyu__", "Mr_127"],

  /* 玩家头像接口（{name} 会被替换成 ID） */
  avatarApi: "https://cravatar.cn/avatar/{name}/64.png"
};
