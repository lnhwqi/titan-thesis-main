import { css } from "@emotion/css"
import { JSX } from "react"
import { color, font, theme } from "../Theme"
import * as RD from "../../../../Core/Data/RemoteData"
import { ProductRating } from "../../../../Core/App/ProductRating"
import { ApiError } from "../../Api"
import { FiStar } from "react-icons/fi"

type Props = {
  ratingsResponse: RD.RemoteData<ApiError<never>, { ratings: ProductRating[] }>
}

function formatDayMonth(value: number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function ProductRatingsSection(props: Props): JSX.Element {
  if (props.ratingsResponse._t === "Loading") {
    return <div className={styles.statusMsg}>Loading ratings...</div>
  }

  if (props.ratingsResponse._t === "Failure") {
    return <div className={styles.statusMsg}>Failed to load ratings</div>
  }

  if (props.ratingsResponse._t !== "Success") {
    return <></>
  }

  const { ratings } = props.ratingsResponse.data

  if (ratings.length === 0) {
    return (
      <div className={styles.noRatings}>
        No ratings yet. Be the first to rate this product!
      </div>
    )
  }

  const averageScore =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score.unwrap(), 0) / ratings.length
      : 0

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>Customer Ratings & Feedback</h3>
        <div className={styles.averageRating}>
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreValue}>{averageScore.toFixed(1)}</span>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((i) => (
                <FiStar
                  key={i}
                  size={16}
                  className={styles.starIcon}
                  style={{
                    fill:
                      i <= Math.round(averageScore)
                        ? color.semantics.warning.yellow500
                        : "none",
                    color:
                      i <= Math.round(averageScore)
                        ? color.semantics.warning.yellow500
                        : color.secondary300,
                  }}
                />
              ))}
            </div>
            <span className={styles.ratingCount}>
              ({ratings.length} {ratings.length === 1 ? "rating" : "ratings"})
            </span>
          </div>
        </div>
      </div>

      <div className={styles.ratingsList}>
        {ratings.map((rating) => (
          <div
            key={`${rating.orderID.unwrap()}`}
            className={styles.ratingItem}
          >
            <div className={styles.ratingHeader}>
              <div className={styles.scoreStars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <FiStar
                    key={i}
                    size={14}
                    style={{
                      fill:
                        i <= rating.score.unwrap()
                          ? color.semantics.warning.yellow500
                          : "none",
                      color:
                        i <= rating.score.unwrap()
                          ? color.semantics.warning.yellow500
                          : color.secondary300,
                    }}
                  />
                ))}
              </div>
              <span className={styles.ratingScore}>
                {rating.score.unwrap()} stars
              </span>
              <span className={styles.ratingDate}>
                {formatDayMonth(rating.createdAt.unwrap())}
              </span>
            </div>

            {rating.feedback != null && (
              <div className={styles.feedbackText}>
                {rating.feedback.unwrap()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  section: css({
    marginTop: theme.s8,
    paddingTop: theme.s6,
    borderTop: `1px solid ${color.secondary100}`,
  }),

  header: css({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.s4,
    marginBottom: theme.s6,
    flexWrap: "wrap",
  }),

  title: css({
    ...font.bold17,
    color: color.secondary500,
    margin: 0,
  }),

  averageRating: css({
    display: "flex",
    alignItems: "center",
  }),

  scoreDisplay: css({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.s2,
    padding: `${theme.s3} ${theme.s4}`,
    backgroundColor: color.neutral50,
    borderRadius: theme.br2,
    border: `1px solid ${color.secondary100}`,
  }),

  scoreValue: css({
    ...font.boldH4_24,
    color: color.secondary500,
  }),

  stars: css({
    display: "flex",
    gap: theme.s1,
  }),

  starIcon: css({
    display: "block",
  }),

  ratingCount: css({
    ...font.medium12,
    color: color.neutral600,
  }),

  ratingsList: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),

  ratingItem: css({
    padding: theme.s4,
    border: `1px solid ${color.secondary100}`,
    borderRadius: theme.br1,
    backgroundColor: color.neutral0,
  }),

  ratingHeader: css({
    display: "flex",
    alignItems: "center",
    gap: theme.s3,
    marginBottom: theme.s2,
    flexWrap: "wrap",
  }),

  scoreStars: css({
    display: "flex",
    gap: theme.s1,
  }),

  ratingScore: css({
    ...font.bold14,
    color: color.secondary500,
  }),

  ratingDate: css({
    ...font.regular12,
    color: color.neutral600,
  }),

  feedbackText: css({
    ...font.regular14,
    color: color.neutral700,
    lineHeight: "1.6",
    marginTop: theme.s2,
  }),

  noRatings: css({
    padding: `${theme.s6} ${theme.s4}`,
    textAlign: "center",
    color: color.neutral600,
    backgroundColor: color.neutral50,
    borderRadius: theme.br1,
    ...font.regular14,
  }),

  statusMsg: css({
    padding: `${theme.s6} ${theme.s4}`,
    textAlign: "center",
    color: color.neutral600,
    ...font.regular14,
  }),
}
