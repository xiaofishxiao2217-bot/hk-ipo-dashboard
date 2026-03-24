# 港股 IPO 看板

一个轻量的静态看板，用来筛选指定时间范围内上市的港股 IPO，并展示：

- 现价
- 累计涨跌幅
- 上市日期
- 认购倍数
- 募资额

## 本地运行

直接打开 `/Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard/index.html` 即可。

如果你希望通过本地服务预览：

```bash
cd /Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard
python3 -m http.server 8080
```

然后访问 `http://localhost:8080`。

## Vercel 部署

这个项目已经是标准静态站结构，Vercel 可以直接部署。

最省事的方式：

1. 把 `/Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard` 推到一个 GitHub 仓库。
2. 打开 [Vercel](https://vercel.com/) 并导入这个仓库。
3. Framework Preset 选择 `Other`。
4. Root Directory 选择仓库根目录或 `hk-ipo-dashboard` 所在目录。
5. 不需要填写 Build Command。
6. Output Directory 留空。
7. 点 `Deploy`。

项目里已经提供了 `/Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard/vercel.json`，用于静态资源和首页缓存控制。

如果你之后想每次发布前先刷新 IPO 快照，建议本地先运行：

```bash
cd /Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard
python3 scripts/fetch_iqdii_ipo_snapshot.py
```

然后再推送到 GitHub，Vercel 部署出来的页面就会带上最新快照。

## 数据结构

示例数据位于 `/Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard/data.js`。

真实快照文件位于 `/Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard/ipo-live.js`，由脚本生成。

可执行以下命令刷新 iqdii IPO 快照：

```bash
cd /Users/hzyitong-15/Documents/Playground/hk-ipo-dashboard
python3 scripts/fetch_iqdii_ipo_snapshot.py
```

前端会优先使用 `ipo-live.js`，若快照为空则回退示例数据。

每条记录最终会整理成如下结构：

```js
{
  code: "02501",
  name: "示例机器人控股",
  industry: "先进制造",
  listedDate: "2025-01-17",
  issuePrice: 18.6,
  currentPrice: 22.45,
  subscriptionMultiple: 38.5,
  fundraisingHKD: 18.2,
  notes: "基石投资者锁定比例较高"
}
```

页面会自动根据 `issuePrice` 和 `currentPrice` 计算累计涨跌幅。

## 下一步可扩展

1. 将 `data.js` 替换为接口拉取或本地 JSON/CSV 文件。
2. 增加首日涨跌幅、每手股数、中签率、保荐人等字段。
3. 接入定时更新任务，做成每日自动刷新的监控看板。
4. 把刷新脚本迁到 GitHub Action 或 Vercel 外部定时任务，自动更新 `ipo-live.js`。
