import { JSX } from "react"
import { css } from "@emotion/css"
import { State } from "../State"
import { color, font, theme } from "../View/Theme"
import * as SDate from "../../../Core/Data/Time/SDate"

type Props = {
  state: State
}

export default function EventPosterPage(props: Props): JSX.Element {
  const { eventPoster } = props.state

  if (
    eventPoster.response._t === "Loading" ||
    eventPoster.response._t === "NotAsked"
  ) {
    return <div className={styles.empty}>Loading event page...</div>
  }

  if (eventPoster.poster == null) {
    return (
      <div className={styles.empty}>
        {eventPoster.errorMessage ?? "Event page not found."}
      </div>
    )
  }

  const poster = eventPoster.poster

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <img
          className={styles.heroImage}
          src={poster.imageUrl.unwrap()}
          alt={poster.name.unwrap()}
          style={{
            transform: `translate(${poster.imageOffsetXPercent}%, ${poster.imageOffsetYPercent}%) scale(${poster.imageScalePercent / 100})`,
          }}
        />
        <div className={styles.heroOverlay}>
          <p className={styles.kicker}>Event</p>
          <h1 className={styles.title}>{poster.name.unwrap()}</h1>
          <p className={styles.subtitle}>{poster.description.unwrap()}</p>
          <p className={styles.meta}>
            {poster.isPermanent
              ? `Starts ${SDate.toString(poster.startDate)} • Permanent`
              : poster.endDate == null
                ? `Starts ${SDate.toString(poster.startDate)}`
                : `${SDate.toString(poster.startDate)} - ${SDate.toString(poster.endDate)}`}
          </p>
        </div>
      </section>

      <section className={styles.contentCard}>
        <h2 className={styles.contentTitle}>Event Details</h2>
        {poster.eventContent.trim() === "" ||
        poster.eventContent === "<p><br></p>" ? (
          <p className={styles.contentEmpty}>
            This event page has no additional content yet.
          </p>
        ) : (
          <div
            className={styles.contentHtml}
            ref={(el) => {
              if (el != null) {
                el.innerHTML = poster.eventContent
              }
            }}
          />
        )}
      </section>
    </div>
  )
}

const styles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
  }),
  empty: css({
    ...font.regular17,
    color: color.neutral700,
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s5,
  }),
  hero: css({
    position: "relative",
    height: "420px",
    borderRadius: theme.s3,
    overflow: "hidden",
    border: `1px solid ${color.genz.purple100}`,
    background: color.neutral100,
  }),
  heroImage: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transformOrigin: "center center",
  }),
  heroOverlay: css({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: theme.s2,
    padding: theme.s5,
    background:
      "linear-gradient(180deg, rgba(18,24,38,0.10) 0%, rgba(18,24,38,0.72) 100%)",
  }),
  kicker: css({
    ...font.bold14,
    color: color.neutral0,
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  }),
  title: css({
    ...font.boldH1_42,
    color: color.neutral0,
    margin: 0,
  }),
  subtitle: css({
    ...font.regular17,
    color: color.neutral0,
    margin: 0,
    maxWidth: "760px",
  }),
  meta: css({
    ...font.regular13,
    color: color.neutral0,
    margin: 0,
    opacity: 0.95,
  }),
  contentCard: css({
    background: color.neutral0,
    border: `1px solid ${color.genz.purple100}`,
    borderRadius: theme.s3,
    padding: theme.s5,
  }),
  contentTitle: css({
    ...font.boldH5_20,
    marginTop: 0,
    marginBottom: theme.s3,
  }),
  contentEmpty: css({
    ...font.regular14,
    color: color.neutral500,
    margin: 0,
    fontStyle: "italic",
  }),
  contentHtml: css({
    ...font.regular14,
    color: color.neutral800,
    lineHeight: 1.8,
    "& h1, & h2, & h3": {
      marginTop: theme.s4,
      marginBottom: theme.s2,
    },
    "& p": {
      margin: `0 0 ${theme.s3}`,
    },
    "& ul, & ol": {
      paddingLeft: theme.s5,
      marginBottom: theme.s3,
    },
    "& a": {
      color: color.genz.purple,
      textDecoration: "underline",
    },
    "& blockquote": {
      borderLeft: `4px solid ${color.genz.purple200}`,
      marginLeft: 0,
      paddingLeft: theme.s3,
      color: color.neutral600,
    },
    "& strong": { fontWeight: 700 },
    "& em": { fontStyle: "italic" },
  }),
}
