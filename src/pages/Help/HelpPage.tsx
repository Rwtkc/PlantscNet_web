import { useEffect, useState } from 'react'
import { toAssetPath } from '@/app/base'
import { moduleContent } from '@/app/module-content'
import { ModulePage } from '@/components/ModulePage'
import {
  helpKeywordPattern,
  helpSections,
  workflowSteps,
  type HelpImage,
  type HelpSection,
  type HelpTextBlock,
} from './help.content'
import '@/styles/help.css'

type ImagePan = {
  x: number
  y: number
}

type DragState = {
  pointerId: number
  startX: number
  startY: number
  panX: number
  panY: number
}

const minImageZoom = 1
const maxImageZoom = 4
const imageZoomStep = 0.25

function clampImageZoom(value: number) {
  return Math.min(maxImageZoom, Math.max(minImageZoom, Number(value.toFixed(2))))
}

function renderHighlightedText(text: string) {
  return text.split(helpKeywordPattern).map((part, index) =>
    part.match(helpKeywordPattern) ? (
      <strong className="help-keyword" key={`${part}-${index}`}>
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

function HelpFigure({
  image,
  onOpen,
}: {
  image: HelpImage
  onOpen: (image: HelpImage) => void
}) {
  return (
    <figure className="help-figure">
      <button
        type="button"
        className="help-figure__zoom"
        onClick={() => onOpen(image)}
        aria-label={`Open larger image: ${image.caption}`}
      >
        <img
          src={toAssetPath(image.src)}
          alt={image.alt}
          loading="lazy"
          decoding="async"
        />
      </button>
      <figcaption>{image.caption}</figcaption>
    </figure>
  )
}

function HelpTextBlocks({ blocks }: { blocks: HelpTextBlock[] }) {
  return (
    <div className="help-text-blocks">
      {blocks.map((block) => (
        <section
          className={
            block.tone
              ? `help-text-block help-text-block--${block.tone}`
              : 'help-text-block'
          }
          key={block.title}
        >
          <h3>{block.title}</h3>
          <p>{renderHighlightedText(block.summary)}</p>
          {block.paragraphs.map((paragraph) => (
            <p key={paragraph}>{renderHighlightedText(paragraph)}</p>
          ))}
        </section>
      ))}
    </div>
  )
}

function HelpNoteBox({ notes }: { notes: string[] }) {
  return (
    <div className="help-note-box">
      {notes.map((note) => (
        <p key={note}>{renderHighlightedText(note)}</p>
      ))}
    </div>
  )
}

function HelpSectionCard({
  section,
  onOpenImage,
}: {
  section: HelpSection
  onOpenImage: (image: HelpImage) => void
}) {
  return (
    <article className="help-section-card">
      <header className="help-section-card__header">
        <p className="help-section-label">{section.eyebrow}</p>
        <h2>{section.title}</h2>
        <p>{renderHighlightedText(section.summary)}</p>
      </header>
      {section.textBlocks ? <HelpTextBlocks blocks={section.textBlocks} /> : null}
      <div className="help-section-card__media">
        {section.images.map((image) => (
          <HelpFigure key={image.src} image={image} onOpen={onOpenImage} />
        ))}
      </div>
      <div className="help-section-card__content">
        <h3>Step-by-step use</h3>
        <ol className="help-step-list">
          {section.steps.map((step) => (
            <li key={step}>{renderHighlightedText(step)}</li>
          ))}
        </ol>
        {section.notes ? <HelpNoteBox notes={section.notes} /> : null}
      </div>
    </article>
  )
}

export default function HelpPage() {
  const [activeImage, setActiveImage] = useState<HelpImage | null>(null)
  const [imageZoom, setImageZoom] = useState(1)
  const [imagePan, setImagePan] = useState<ImagePan>({ x: 0, y: 0 })
  const [dragState, setDragState] = useState<DragState | null>(null)

  useEffect(() => {
    if (!activeImage) {
      return undefined
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveImage(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImage])

  useEffect(() => {
    setImageZoom(1)
    setImagePan({ x: 0, y: 0 })
    setDragState(null)
  }, [activeImage])

  function updateImageZoom(nextZoom: number) {
    const clampedZoom = clampImageZoom(nextZoom)
    setImageZoom(clampedZoom)

    if (clampedZoom === minImageZoom) {
      setImagePan({ x: 0, y: 0 })
    }
  }

  function resetImageView() {
    setImageZoom(1)
    setImagePan({ x: 0, y: 0 })
    setDragState(null)
  }

  return (
    <ModulePage module={moduleContent.help} hideInfoSections>
      <section
        className="help-workflow fade-rise"
        aria-label="Typical PlantScNet workflow"
      >
        {workflowSteps.map((step, index) => (
          <article key={step.title} className="help-workflow__item">
            <span className="help-workflow__index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h2>{step.title}</h2>
            <p>{renderHighlightedText(step.text)}</p>
          </article>
        ))}
      </section>

      <section
        className="help-section-list fade-rise"
        aria-label="Illustrated module guide"
      >
        {helpSections.map((section) => (
          <HelpSectionCard
            key={section.title}
            section={section}
            onOpenImage={setActiveImage}
          />
        ))}
      </section>

      <section
        className="help-closing-grid fade-rise"
        aria-label="Interpretation and contact notes"
      >
        <article className="extra-card">
          <p className="help-section-label">Interpretation</p>
          <h2>Read network relationships as regulatory hypotheses.</h2>
          <p className="help-intro">
            {renderHighlightedText(
              'PlantScNet results are inferred from single-cell regulatory evidence. They are useful for prioritizing candidate regulators, target genes, tissues, and species, but should still be considered together with prior biological knowledge and experimental evidence.',
            )}
          </p>
        </article>

        <article className="extra-card">
          <p className="help-section-label">Contact</p>
          <h2>Questions and data feedback</h2>
          <p className="help-intro">
            {renderHighlightedText(
              'If you find a questionable regulatory relationship, inconsistent annotation, missing download file, or interpretation issue, please contact us through the Contact page or by email.',
            )}
          </p>
          <p className="help-intro">
            Email:{' '}
            <a className="help-link" href="mailto:cuicui001116@163.com">
              cuicui001116@163.com
            </a>
          </p>
        </article>
      </section>

      {activeImage ? (
        <div
          className="help-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeImage.caption}
        >
          <button
            type="button"
            className="help-lightbox__backdrop"
            aria-label="Close image preview"
            onClick={() => setActiveImage(null)}
          />
          <div className="help-lightbox__panel">
            <div className="help-lightbox__toolbar">
              <p>{activeImage.caption}</p>
              <div className="help-lightbox__controls" aria-label="Image zoom controls">
                <button
                  type="button"
                  onClick={() => updateImageZoom(imageZoom - imageZoomStep)}
                  disabled={imageZoom <= minImageZoom}
                >
                  -
                </button>
                <span>{Math.round(imageZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => updateImageZoom(imageZoom + imageZoomStep)}
                  disabled={imageZoom >= maxImageZoom}
                >
                  +
                </button>
                <button type="button" onClick={resetImageView}>
                  Reset
                </button>
                <button type="button" onClick={() => setActiveImage(null)}>
                  Close
                </button>
              </div>
            </div>
            <div
              className={
                imageZoom > minImageZoom
                  ? 'help-lightbox__image-stage help-lightbox__image-stage--draggable'
                  : 'help-lightbox__image-stage'
              }
              onWheel={(event) => {
                event.preventDefault()
                updateImageZoom(
                  imageZoom + (event.deltaY < 0 ? imageZoomStep : -imageZoomStep),
                )
              }}
              onPointerDown={(event) => {
                if (imageZoom <= minImageZoom) {
                  return
                }

                event.currentTarget.setPointerCapture(event.pointerId)
                setDragState({
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  panX: imagePan.x,
                  panY: imagePan.y,
                })
              }}
              onPointerMove={(event) => {
                if (!dragState || dragState.pointerId !== event.pointerId) {
                  return
                }

                setImagePan({
                  x: dragState.panX + event.clientX - dragState.startX,
                  y: dragState.panY + event.clientY - dragState.startY,
                })
              }}
              onPointerUp={(event) => {
                if (dragState?.pointerId === event.pointerId) {
                  setDragState(null)
                }
              }}
              onPointerCancel={() => setDragState(null)}
            >
              <img
                src={toAssetPath(activeImage.src)}
                alt={activeImage.alt}
                draggable={false}
                style={{
                  transform: `translate(${imagePan.x}px, ${imagePan.y}px) scale(${imageZoom})`,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </ModulePage>
  )
}
