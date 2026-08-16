'use strict';


class FeelingsWheel extends HTMLElement {
  constructor() {
    super();

    const container = document.createElement("template");
    container.innerHTML = `
       <slot></slot>
    `;

    const style = document.createElement("style");
    style.textContent = `
      :host {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        position: absolute;
        overflow: hidden;
        background: #eee;
      }
    `;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(container.content.cloneNode(true));
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');

    slot.addEventListener('slotchange', () => {
      const slottedElements = slot.assignedElements();
      slottedElements.forEach((child, idx) => {
        child.dataset.idx = idx;
        child.dataset.total = slottedElements.length;
      });
    });
  }
}

class Segment extends HTMLElement {
  constructor() {
    super();

    const segmentContainer = document.createElement("div");

    const style = document.createElement("style");
    style.textContent = `
      :host {
        --total: attr(data-total type(<number>));
        --i: attr(data-idx type(<number>));
      }

      .segment {
        position: absolute;
        display: block;
        top: 50%;
        left: 50%;
        width: 50%;
        pointer-events: none;
        transform: translate(0, -50%);
      }

      .segment>span {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        width: 100%;
        box-sizing: border-box;
        transform-origin: 0 50%;
        pointer-events: all;
        padding-left: 25%;
        font-variant: small-caps slashed-zero;
        z-index: 2;

        --pi-fraction: pi / var(--total);
        --total-fraction: var(--i) / var(--total);

        height: calc(sin(var(--pi-fraction)) * 100cqw);
        --clip-position: calc(cos(var(--pi-fraction)) * 100%);
        clip-path: polygon(100% 0px, var(--clip-position) 0px, 0px 50%, var(--clip-position) 100%, 100% 100%);
        transform: rotate(calc(360deg * var(--total-fraction)));
        background-color: var(--bg-color);
      }
    `;
    segmentContainer.classList.add("segment");

    const innerSpan = document.createElement("span");
    innerSpan.innerHTML = `
       <slot></slot>
    `;
    segmentContainer.appendChild(innerSpan);

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(segmentContainer);
  }
}

customElements.define('feelings-wheel', FeelingsWheel);
customElements.define('feeling-segment', Segment);
