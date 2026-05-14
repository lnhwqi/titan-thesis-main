import { JSX } from "react"
import { css, keyframes } from "@emotion/css"
import { AuthState, PublicState } from "../State"
import { color, font, theme } from "../View/Theme"
import { ProductCard } from "../View/Part/ProductCard"
import { emit } from "../Runtime/React"
import { cmd, perform } from "../Action"
import { navigateTo, toRoute } from "../Route"
import * as MessageAction from "../Action/Message"
import * as ProductAction from "../Action/Product"
import { fadeSlideUp, glowPulse, shimmer } from "../View/Theme/Keyframe"

export type SellerProfilePageProps = { state: AuthState | PublicState }

export default function SellerProfilePage(
  props: SellerProfilePageProps,
): JSX.Element {
  const { state } = props
  const sellerRD = state.product.sellerProfileResponse
  const productsRD = state.product.sellerProductsResponse

  if (sellerRD._t === "Loading") {
    return (
      <div className={styles.fullscreenStatus}>
        <div className={styles.skeletonHero} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={styles.skeletonCard}
            />
          ))}
        </div>
      </div>
    )
  }

  if (sellerRD._t === "Failure") {
    return (
      <div className={styles.fullscreenStatus}>
        <div className={styles.errorBox}>
          <span className={styles.errorEmoji}>🏪</span>
          <span className={styles.errorText}>Seller shop not found.</span>
        </div>
      </div>
    )
  }

  if (sellerRD._t !== "Success") {
    return <></>
  }

  const seller = sellerRD.data.seller
  const allProducts =
    state.product.listResponse._t === "Success"
      ? state.product.listResponse.data.items
      : []
  const products =
    productsRD._t === "Success"
      ? productsRD.data.items
      : allProducts.filter(
          (item) => item.sellerID.unwrap() === seller.id.unwrap(),
        )

  const shopName = seller.shopName.unwrap()
  const shopDescription = seller.shopDescription.unwrap()
  const shopInitial = shopName.charAt(0).toUpperCase()
  const productCount = products.length
  const sellerVouchers = state.product.sellerAvailableVouchers
  const claimingVoucherID = state.product.sellerVoucherClaimingID
  const recentlyClaimedID = state.product.sellerVoucherRecentlyClaimedID
  const voucherFlashMessage = state.product.sellerVoucherFlashMessage
  const authUser = "updateProfile" in state ? state : null

  // Pagination
  const page = state.product.sellerListPage
  const limit = state.product.sellerListLimit
  const totalPages = Math.max(1, Math.ceil(productCount / limit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * limit
  const paginatedProducts = products.slice(start, start + limit)

  return (
    <div className={styles.page}>
      {/* ── Hero banner ── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          {/* Avatar */}
          <div className={styles.shopAvatarWrap}>
            <div className={styles.shopAvatar}>{shopInitial}</div>
            <div className={styles.avatarRing} />
          </div>

          {/* Info */}
          <div className={styles.heroInfo}>
            <div className={styles.heroMeta}>
              <span className={styles.heroBadge}>✦ Official Store</span>
            </div>
            <h1 className={styles.heroShopName}>{shopName}</h1>
            {shopDescription.trim().length > 0 && (
              <p className={styles.heroDescription}>{shopDescription}</p>
            )}
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{productCount}</span>
                <span className={styles.statLabel}>Products</span>
              </div>
            </div>
          </div>

          {authUser != null ? (
            <button
              className={styles.messageBtn}
              onClick={() =>
                emit(MessageAction.openConversationWithSeller(seller.id))
              }
            >
              💬 Message Seller
            </button>
          ) : (
            <button
              className={styles.messageBtnGuest}
              onClick={() =>
                emit((s) => [
                  s,
                  cmd(
                    perform(navigateTo(toRoute("Login", { redirect: null }))),
                  ),
                ])
              }
            >
              💬 Login to Message
            </button>
          )}
        </div>
      </div>

      {voucherFlashMessage != null ? (
        <div className={styles.noticeRow}>
          <span>{voucherFlashMessage}</span>
          <button
            className={styles.noticeClose}
            onClick={() => emit(ProductAction.clearSellerVoucherFlashMessage())}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <section className={styles.voucherSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionTitleGradient}>Shop Vouchers</span>
          </h2>
        </div>

        {authUser == null ? (
          <div className={styles.voucherEmpty}>
            Log in to claim this shop vouchers.
          </div>
        ) : state.product.sellerVoucherListResponse._t === "Loading" ? (
          <div className={styles.voucherEmpty}>Loading vouchers...</div>
        ) : state.product.sellerVoucherListResponse._t === "Failure" ? (
          <div className={styles.voucherEmpty}>Could not load vouchers.</div>
        ) : sellerVouchers.length === 0 ? (
          <div className={styles.voucherEmpty}>
            No available vouchers for this shop.
          </div>
        ) : (
          <div className={styles.voucherGrid}>
            {sellerVouchers.map((voucher) => {
              const remaining =
                voucher.limit.unwrap() - voucher.usedCount.unwrap()
              const isClaiming = claimingVoucherID === voucher.id.unwrap()
              const isRecentlyClaimed =
                recentlyClaimedID === voucher.id.unwrap()

              return (
                <article
                  key={voucher.id.unwrap()}
                  className={styles.voucherCard}
                >
                  {isRecentlyClaimed ? (
                    <div className={styles.claimedBadge}>Claimed</div>
                  ) : null}
                  <div className={styles.voucherCode}>
                    {voucher.code.unwrap()}
                  </div>
                  <div className={styles.voucherName}>
                    {voucher.name.unwrap()}
                  </div>
                  <div className={styles.voucherMeta}>
                    <div>
                      Discount: {formatCurrency(voucher.discount.unwrap())}
                    </div>
                    <div>
                      Min order:{" "}
                      {formatCurrency(voucher.minOrderValue.unwrap())}
                    </div>
                    <div>Remaining: {Math.max(remaining, 0)}</div>
                    <div>
                      Expire: {formatDate(voucher.expiredDate.unwrap())}
                    </div>
                  </div>
                  <button
                    className={styles.claimButton}
                    onClick={() =>
                      emit(
                        ProductAction.claimSellerVoucher(voucher.id.unwrap()),
                      )
                    }
                    disabled={isClaiming}
                  >
                    {isClaiming ? "Claiming..." : "Claim Voucher"}
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Products ── */}
      <div className={styles.productsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionTitleGradient}>All Products</span>
          </h2>
          <span className={styles.sectionCount}>{productCount} items</span>
        </div>

        {productsRD._t === "Loading" ? (
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeletonCard}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className={styles.emptyBox}>
            <span className={styles.emptyEmoji}>📦</span>
            <span className={styles.emptyText}>
              Seller didnt post any product yet
            </span>
          </div>
        ) : (
          <>
            {/* Info row */}
            <div className={styles.paginationInfo}>
              Showing {start + 1}–{Math.min(start + limit, productCount)} of{" "}
              {productCount}
            </div>

            {/* Grid */}
            <div className={styles.grid}>
              {paginatedProducts.map((product, i) => (
                <div
                  key={product.id.unwrap()}
                  className={styles.cardWrap}
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <ProductCard
                    product={product}
                    state={state}
                  />
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className={styles.paginationRow}>
                <button
                  className={styles.pageNavBtn}
                  onClick={() =>
                    emit(ProductAction.changeSellerListPage(safePage - 1))
                  }
                  disabled={safePage === 1}
                >
                  ← Previous
                </button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        className={`${styles.pageNum} ${p === safePage ? styles.pageNumActive : ""}`}
                        onClick={() =>
                          emit(ProductAction.changeSellerListPage(p))
                        }
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>

                <button
                  className={styles.pageNavBtn}
                  onClick={() =>
                    emit(ProductAction.changeSellerListPage(safePage + 1))
                  }
                  disabled={safePage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function formatCurrency(value: number): string {
  return `T ${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)}`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB")
}

const claimPop = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-6px) scale(0.92);
  }
  70% {
    opacity: 1;
    transform: translateY(0) scale(1.04);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`

const styles = {
  page: css({
    width: "100%",
    maxWidth: "min(100%, 1280px)",
    margin: "0 auto",
    padding: `0 0 ${theme.s8}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s6,
  }),

  heroBanner: css({
    position: "relative",
    borderRadius: "0 0 28px 28px",
    overflow: "hidden",
    minHeight: "260px",
    display: "flex",
    alignItems: "flex-end",
  }),
  heroBg: css({
    position: "absolute",
    inset: 0,
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.secondary400} 40%, ${color.primary400} 100%)`,
    backgroundSize: "300% 300%",
    animation: `${shimmer} 8s ease infinite`,
    "&::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      background:
        "radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)",
    },
  }),
  heroContent: css({
    position: "relative",
    zIndex: 1,
    width: "100%",
    display: "flex",
    alignItems: "flex-end",
    gap: theme.s5,
    padding: `${theme.s8} ${theme.s6} ${theme.s6}`,
    flexWrap: "wrap",
    animation: `${fadeSlideUp} 0.6s ease both`,
  }),

  shopAvatarWrap: css({
    position: "relative",
    flexShrink: 0,
  }),
  shopAvatar: css({
    width: "88px",
    height: "88px",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(12px)",
    border: "3px solid rgba(255,255,255,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "36px",
    fontWeight: 700,
    color: color.neutral0,
    boxShadow: "0 8px 32px rgba(0,0,0,0.25), 0 0 0 6px rgba(255,255,255,0.12)",
    letterSpacing: "-1px",
  }),
  avatarRing: css({
    position: "absolute",
    inset: "-6px",
    borderRadius: "50%",
    border: "2px dashed rgba(255,255,255,0.4)",
    animation: `${glowPulse} 3s ease-in-out infinite`,
  }),

  heroInfo: css({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: 0,
  }),
  heroMeta: css({
    display: "flex",
    gap: theme.s2,
    alignItems: "center",
  }),
  heroBadge: css({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 10px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255,255,255,0.35)",
    color: color.neutral0,
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.3px",
  }),
  heroShopName: css({
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
    color: color.neutral0,
    lineHeight: 1.15,
    textShadow: "0 2px 12px rgba(0,0,0,0.25)",
    letterSpacing: "-0.5px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  heroDescription: css({
    margin: 0,
    ...font.regular14,
    color: "rgba(255,255,255,0.82)",
    maxWidth: "min(100%, 520px)",
    lineHeight: 1.55,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }),
  heroStats: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
    marginTop: "4px",
  }),
  statItem: css({
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  }),
  statValue: css({
    ...font.bold17,
    color: color.neutral0,
    lineHeight: 1,
  }),
  statLabel: css({
    ...font.regular12,
    color: "rgba(255,255,255,0.65)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  statDivider: css({
    width: "1px",
    height: "28px",
    background: "rgba(255,255,255,0.25)",
  }),

  messageBtn: css({
    alignSelf: "flex-end",
    padding: `${theme.s2} ${theme.s5}`,
    background: "rgba(255,255,255,0.18)",
    backdropFilter: "blur(10px)",
    border: "1.5px solid rgba(255,255,255,0.55)",
    borderRadius: theme.brFull,
    color: color.neutral0,
    ...font.bold14,
    cursor: "pointer",
    transition: "all 0.22s ease",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "rgba(255,255,255,0.32)",
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  }),
  messageBtnGuest: css({
    alignSelf: "flex-end",
    padding: `${theme.s2} ${theme.s5}`,
    background: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(10px)",
    border: "1.5px dashed rgba(255,255,255,0.45)",
    borderRadius: theme.brFull,
    color: "rgba(255,255,255,0.8)",
    ...font.bold14,
    cursor: "pointer",
    transition: "all 0.22s ease",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "rgba(255,255,255,0.22)",
      borderStyle: "solid",
      borderColor: "rgba(255,255,255,0.65)",
      color: color.neutral0,
      transform: "translateY(-2px)",
      boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
    },
    "&:active": { transform: "translateY(0)" },
  }),

  noticeRow: css({
    margin: `0 ${theme.s5}`,
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.br2,
    background: color.secondary50,
    padding: `${theme.s2} ${theme.s3}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.s2,
    ...font.medium14,
    color: color.secondary500,
  }),
  noticeClose: css({
    border: "none",
    background: "transparent",
    color: color.secondary500,
    ...font.bold14,
    cursor: "pointer",
  }),

  voucherSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s3,
    padding: `0 ${theme.s5}`,
  }),
  voucherGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: theme.s3,
  }),
  voucherCard: css({
    position: "relative",
    border: `1px solid ${color.secondary200}`,
    borderRadius: theme.br2,
    background: color.neutral0,
    padding: theme.s3,
    display: "grid",
    gap: theme.s2,
  }),
  claimedBadge: css({
    position: "absolute",
    top: theme.s2,
    right: theme.s2,
    padding: "2px 10px",
    borderRadius: theme.brFull,
    background: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
    color: color.neutral0,
    ...font.bold12,
    animation: `${claimPop} 320ms ease-out`,
    boxShadow: "0 6px 14px rgba(34,197,94,0.3)",
  }),
  voucherCode: css({
    ...font.bold17,
    color: color.secondary500,
    letterSpacing: "0.4px",
  }),
  voucherName: css({
    ...font.medium14,
    color: color.neutral800,
  }),
  voucherMeta: css({
    ...font.regular12,
    color: color.neutral600,
    display: "grid",
    gap: "4px",
  }),
  claimButton: css({
    border: "none",
    borderRadius: theme.brFull,
    padding: `${theme.s2} ${theme.s3}`,
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    color: color.neutral0,
    ...font.bold14,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:disabled": {
      opacity: 0.6,
      cursor: "not-allowed",
    },
  }),
  voucherEmpty: css({
    ...font.medium14,
    color: color.neutral500,
    border: `1px dashed ${color.secondary200}`,
    borderRadius: theme.br2,
    padding: `${theme.s3} ${theme.s4}`,
  }),

  /* ── Products section ── */
  productsSection: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
    padding: `0 ${theme.s5}`,
  }),
  sectionHeader: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.s3,
  }),
  sectionTitle: css({
    margin: 0,
    fontSize: "22px",
    fontWeight: 800,
    lineHeight: 1,
  }),
  sectionTitleGradient: css({
    color: "var(--app-accent)",
  }),
  sectionCount: css({
    ...font.medium12,
    color: color.neutral500,
    background: "var(--app-brand-20)",
    border: "1px solid var(--app-border)",
    borderRadius: "20px",
    padding: "3px 10px",
  }),

  paginationInfo: css({
    ...font.regular12,
    color: color.neutral500,
  }),

  grid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: theme.s4,
  }),
  cardWrap: css({
    animation: `${fadeSlideUp} 0.5s ease both`,
  }),

  paginationRow: css({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.s3,
    marginTop: theme.s4,
    flexWrap: "wrap",
  }),
  pageNavBtn: css({
    padding: `${theme.s2} ${theme.s4}`,
    borderRadius: theme.brFull,
    border: "1px solid var(--app-border)",
    background: "var(--app-brand-20)",
    color: "var(--app-accent)",
    ...font.medium14,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover:not(:disabled)": {
      background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
      borderColor: "transparent",
      color: color.neutral0,
      transform: "translateY(-1px)",
      boxShadow: theme.elevation.small,
    },
    "&:disabled": {
      opacity: 0.35,
      cursor: "not-allowed",
    },
  }),
  pageNumbers: css({
    display: "flex",
    gap: theme.s1,
    flexWrap: "wrap",
    justifyContent: "center",
  }),
  pageNum: css({
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "1px solid var(--app-border)",
    background: "transparent",
    color: color.genz.purple,
    ...font.medium14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.18s ease",
    "&:hover": {
      background: "var(--app-brand-20)",
      borderColor: color.genz.purple,
    },
  }),
  pageNumActive: css({
    background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    borderColor: "transparent",
    color: color.neutral0,
    boxShadow: theme.elevation.small,
    "&:hover": {
      background: `linear-gradient(135deg, ${color.secondary500} 0%, ${color.primary500} 100%)`,
    },
  }),

  /* ── Skeleton ── */
  fullscreenStatus: css({
    width: "100%",
    maxWidth: "min(100%, 1280px)",
    margin: "0 auto",
    padding: `0 ${theme.s5} ${theme.s8}`,
    display: "flex",
    flexDirection: "column",
    gap: theme.s6,
  }),
  skeletonHero: css({
    height: "260px",
    borderRadius: `0 0 28px 28px`,
    background:
      "linear-gradient(90deg, rgba(0,82,156,0.08) 25%, rgba(237,28,36,0.10) 50%, rgba(0,82,156,0.08) 75%)",
    backgroundSize: "200% 100%",
    animation: `${shimmer} 1.5s infinite`,
  }),
  skeletonGrid: css({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: theme.s4,
    padding: `0 ${theme.s5}`,
  }),
  skeletonCard: css({
    height: "280px",
    borderRadius: theme.br2,
    background:
      "linear-gradient(90deg, rgba(0,82,156,0.06) 25%, rgba(237,28,36,0.09) 50%, rgba(0,82,156,0.06) 75%)",
    backgroundSize: "200% 100%",
    animation: `${shimmer} 1.5s infinite`,
  }),

  /* ── Empty / error ── */
  emptyBox: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s3,
    padding: `${theme.s8} ${theme.s4}`,
    borderRadius: theme.br2,
    border: "1px dashed var(--app-border)",
    background: "var(--app-brand-20)",
  }),
  emptyEmoji: css({ fontSize: "40px" }),
  emptyText: css({
    ...font.medium14,
    color: color.neutral500,
  }),
  errorBox: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s3,
    padding: `${theme.s8} ${theme.s4}`,
  }),
  errorEmoji: css({ fontSize: "48px" }),
  errorText: css({
    ...font.medium17,
    color: color.neutral600,
  }),
}
