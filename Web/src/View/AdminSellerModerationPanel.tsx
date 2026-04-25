import { JSX } from "react"
import { css } from "@emotion/css"
import { color, font, theme, bp } from "./Theme"
import * as RD from "../../../Core/Data/RemoteData"
import { Seller } from "../../../Core/App/Seller"
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export type Props = {
  sellersResponse: RD.RemoteData<unknown, { sellers: Seller[] }>
  filterBy:
    | "revenue-high"
    | "revenue-low"
    | "profit-high"
    | "profit-low"
    | "none"
  onFilterChange: (filter: Props["filterBy"]) => void
}

// Safe parser to eliminate the need for the 'as' keyword
function parseFilterOption(value: string): Props["filterBy"] {
  switch (value) {
    case "revenue-high":
    case "revenue-low":
    case "profit-high":
    case "profit-low":
      return value
    default:
      return "none"
  }
}

export default function AdminSellerModerationPanel(props: Props): JSX.Element {
  const sellers = (() => {
    if (props.sellersResponse._t === "Success") {
      const data = [...props.sellersResponse.data.sellers]

      if (props.filterBy === "revenue-high") {
        return data.sort((a, b) => b.revenue.unwrap() - a.revenue.unwrap())
      } else if (props.filterBy === "revenue-low") {
        return data.sort((a, b) => a.revenue.unwrap() - b.revenue.unwrap())
      } else if (props.filterBy === "profit-high") {
        return data.sort((a, b) => b.profit.unwrap() - a.profit.unwrap())
      } else if (props.filterBy === "profit-low") {
        return data.sort((a, b) => a.profit.unwrap() - b.profit.unwrap())
      }
      return data
    }
    return []
  })()

  // Calculate tier distribution safely without the 'as' keyword
  const tierCounts = sellers.reduce<Record<string, number>>((acc, seller) => {
    const tier = seller.tier.unwrap()
    acc[tier] = (acc[tier] || 0) + 1
    return acc
  }, {})

  const tierColors: Record<string, string> = {
    bronze: color.semantics.warning.orange500,
    silver: color.genz.purpleLight,
    gold: color.semantics.warning.yellow500,
  }

  const pieData = Object.entries(tierCounts).map(([tier, count]) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value: count,
    fill: tierColors[tier] || color.genz.pink,
  }))

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seller Moderation</h2>
        <div className={styles.filterControls}>
          <label className={styles.filterLabel}>Sort by:</label>
          <select
            className={styles.filterSelect}
            value={props.filterBy}
            onChange={(e) =>
              props.onFilterChange(parseFilterOption(e.currentTarget.value))
            }
          >
            <option value="none">Default</option>
            <option value="revenue-high">Revenue (Highest)</option>
            <option value="revenue-low">Revenue (Lowest)</option>
            <option value="profit-high">Profit (Highest)</option>
            <option value="profit-low">Profit (Lowest)</option>
          </select>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tableSection}>
          <h3 className={styles.sectionTitle}>
            All Sellers ({sellers.length})
          </h3>

          {props.sellersResponse._t === "NotAsked" && (
            <div className={styles.infoMeta}>Ready to load data.</div>
          )}
          {props.sellersResponse._t === "Loading" && (
            <div className={styles.infoMeta}>Loading sellers list...</div>
          )}
          {props.sellersResponse._t === "Failure" && (
            <div className={styles.infoMetaError}>
              Failed to load sellers data.
            </div>
          )}
          {props.sellersResponse._t === "Success" && (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Shop Name</th>
                    <th>Email</th>
                    <th className={styles.numberCell}>Revenue</th>
                    <th className={styles.numberCell}>Profit</th>
                    <th className={styles.centerCell}>Tier</th>
                    <th className={styles.numberCell}>Tax Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.id.unwrap()}>
                      <td className={styles.shopName}>
                        {seller.shopName.unwrap()}
                      </td>
                      <td className={styles.email}>{seller.email.unwrap()}</td>
                      <td className={styles.numberCellData}>
                        ₫{Number(seller.revenue.unwrap()).toLocaleString()}
                      </td>
                      <td className={styles.numberCellData}>
                        ₫{Number(seller.profit.unwrap()).toLocaleString()}
                      </td>
                      <td className={styles.centerCell}>
                        <span
                          className={styles.tierBadge}
                          style={{
                            backgroundColor:
                              tierColors[seller.tier.unwrap()] ||
                              color.genz.pink,
                          }}
                        >
                          {seller.tier.unwrap().toUpperCase()}
                        </span>
                      </td>
                      <td className={styles.numberCellData}>
                        {seller.tax.unwrap()}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.chartSection}>
          <h3 className={styles.sectionTitle}>Tier Distribution</h3>
          {pieData.length > 0 ? (
            <div className={styles.chartWrapper}>
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={45} // Makes it a professional donut chart
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: color.neutral0,
                      border: `1px solid ${color.genz.purple200}`,
                      borderRadius: theme.s2,
                      ...font.regular14,
                      boxShadow: theme.elevation.medium,
                    }}
                    formatter={(value) =>
                      `${value} seller${value !== 1 ? "s" : ""}`
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.infoMeta}>
              No distribution data available.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s4,
    padding: theme.s5,
    boxShadow: theme.elevation.medium,
  }),
  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.s5,
    ...bp.sm({
      flexDirection: "column",
      gap: theme.s4,
      alignItems: "flex-start",
    }),
  }),
  title: css({
    ...font.boldH4_24,
    margin: 0,
    color: color.neutral900,
  }),
  filterControls: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
    background: color.neutral50,
    padding: `${theme.s2} ${theme.s3}`,
    borderRadius: theme.s2,
    border: `1px solid ${color.genz.purple100}`,
  }),
  filterLabel: css({
    ...font.medium14,
    color: color.neutral700,
  }),
  filterSelect: css({
    padding: `${theme.s2} ${theme.s4} ${theme.s2} ${theme.s2}`,
    border: `1px solid ${color.genz.purple300}`,
    borderRadius: theme.s2,
    ...font.regular14,
    backgroundColor: color.neutral0,
    color: color.neutral900,
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s",
    "&:hover": {
      borderColor: color.genz.purple,
    },
    "&:focus": {
      borderColor: color.genz.pink,
    },
  }),
  content: css({
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: theme.s6,
    // Use an asymmetric layout: Table gets 2 parts, Chart gets 1 part
    ...bp.lg({
      gridTemplateColumns: "2fr 1fr",
    }),
  }),
  tableSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  chartSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  sectionTitle: css({
    ...font.boldH5_20,
    margin: 0,
    color: color.neutral800,
    borderBottom: `1px solid ${color.neutral100}`,
    paddingBottom: theme.s2,
  }),
  tableWrapper: css({
    width: "100%",
    overflowX: "auto",
    border: `1px solid ${color.genz.purple200}`,
    borderRadius: theme.s3,
    background: color.neutral0,
  }),
  table: css({
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    "th, td": {
      padding: `${theme.s3} ${theme.s4}`,
      borderBottom: `1px solid ${color.genz.purple100}`,
      whiteSpace: "nowrap",
    },
    th: {
      ...font.medium12,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      color: color.neutral600,
      background: color.neutral50,
      borderBottom: `2px solid ${color.genz.purple200}`,
    },
    "tr:last-child td": {
      borderBottom: "none",
    },
    "tr:hover td": {
      background: color.neutral50,
    },
  }),
  shopName: css({
    ...font.medium14,
    color: color.neutral900,
  }),
  email: css({
    ...font.regular14,
    color: color.neutral600,
  }),
  numberCell: css({
    textAlign: "right",
  }),
  numberCellData: css({
    ...font.medium14,
    color: color.neutral900,
    textAlign: "right",
  }),
  centerCell: css({
    textAlign: "center",
  }),
  tierBadge: css({
    display: "inline-block",
    padding: `${theme.s1} ${theme.s3}`,
    borderRadius: "12px", // rounded pill look
    color: color.neutral0,
    ...font.bold12,
    letterSpacing: "0.5px",
    textAlign: "center",
    minWidth: "70px",
  }),
  chartWrapper: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s4,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }),
  infoMeta: css({
    ...font.regular14,
    color: color.neutral600,
    padding: theme.s6,
    textAlign: "center",
    background: color.neutral50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.genz.purple200}`,
  }),
  infoMetaError: css({
    ...font.regular14,
    color: color.semantics.error.red500,
    padding: theme.s6,
    textAlign: "center",
    background: color.semantics.error.red50,
    borderRadius: theme.s2,
    border: `1px dashed ${color.genz.pinkLight}`,
  }),
}
