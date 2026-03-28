import { css } from "@emotion/css"
import { JSX } from "react"
import { State } from "../../State"
import { color, font, theme } from "../Theme"
import { toString as sDateToString } from "../../../../Core/Data/Time/SDate"
import { Poster } from "../../../../Core/App/Poster"

type Props = {
  state: State
}

export default function HomePoster(props: Props): JSX.Element {
  const { posters, response } = props.state.homePoster

  if (response._t === "Loading" || response._t === "NotAsked") {
    return (
      <section className={styles.posterList}>
        <article className={styles.posterPlaceholder}>
          Loading posters...
        </article>
      </section>
    )
  }

  if (response._t === "Failure") {
    return (
      <section className={styles.posterList}>
        <article className={styles.posterPlaceholder}>
          Failed to load posters.
        </article>
      </section>
    )
  }

  if (posters.length === 0) {
    return (
      <section className={styles.posterList}>
        <article className={styles.posterPlaceholder}>
          No active posters.
        </article>
      </section>
    )
  }

  return (
    <section className={styles.posterList}>
      {posters.map((poster) => (
        <article
          className={styles.poster}
          key={poster.id.unwrap()}
        >
          <img
            src={poster.imageUrl.unwrap()}
            alt={poster.name.unwrap()}
            className={styles.posterImage}
            style={{
              transform: `translate(${poster.imageOffsetXPercent}%, ${poster.imageOffsetYPercent}%) scale(${poster.imageScalePercent / 100})`,
            }}
          />
          <div className={styles.posterOverlay}>
            <span className={styles.eventBadge}>{eventLabel(poster)}</span>
            <h1 className={styles.posterTitle}>{poster.name.unwrap()}</h1>
            <p className={styles.posterSubtitle}>
              {poster.description.unwrap()}
            </p>
          </div>
        </article>
      ))}
    </section>
  )
}

function eventLabel(poster: Poster): string {
  const start = sDateToString(poster.startDate)

  if (poster.isPermanent) {
    return `Starts ${start} • Permanent`
  }

  if (poster.endDate == null) {
    return `Starts ${start}`
  }

  return `${start} - ${sDateToString(poster.endDate)}`
}

const styles = {
  posterList: css({
    display: "flex",
    flexDirection: "column",
    gap: theme.s4,
    marginBottom: theme.s5,
  }),
  poster: css({
    position: "relative",
    width: "100%",
    height: "280px",
    borderRadius: theme.s3,
    overflow: "hidden",
    background: color.neutral100,
    border: `1px solid ${color.secondary100}`,
  }),
  posterPlaceholder: css({
    height: "280px",
    borderRadius: theme.s3,
    border: `1px dashed ${color.secondary200}`,
    background: color.neutral50,
    color: color.neutral700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ...font.regular17,
  }),
  posterImage: css({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transformOrigin: "center center",
  }),
  posterOverlay: css({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    gap: theme.s2,
    padding: theme.s5,
    background:
      "linear-gradient(180deg, rgba(18,24,38,0.06) 0%, rgba(18,24,38,0.68) 100%)",
  }),
  eventBadge: css({
    ...font.bold14,
    color: color.neutral0,
    alignSelf: "flex-start",
    backgroundColor: "rgba(18, 24, 38, 0.62)",
    border: `1px solid rgba(255, 255, 255, 0.35)`,
    borderRadius: theme.s2,
    padding: `${theme.s1} ${theme.s2}`,
    marginBottom: theme.s2,
    backdropFilter: "blur(2px)",
  }),
  posterTitle: css({
    ...font.boldH1_42,
    color: color.neutral0,
    margin: 0,
    lineHeight: 1.05,
  }),
  posterSubtitle: css({
    ...font.regular17,
    color: color.neutral0,
    margin: 0,
    maxWidth: "680px",
  }),
}
