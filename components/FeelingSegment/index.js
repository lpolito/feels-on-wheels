// safari doesn't support css type import yet, do some nonsense below
// import styles from './styles.css' with { type: 'css' };

const stylesheet = document.querySelector('[href="components/FeelingSegment/styles.css"]').sheet;
const stylesheetRules = [...stylesheet.cssRules];
const stylesheetText = stylesheetRules.reduce((accumulator, rule) => accumulator + rule.cssText, '');
const styles = new CSSStyleSheet();
styles.replace(stylesheetText);

class FeelingSegment extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [styles];

    const contents = document.createElement("div");
    contents.classList.add("contents");
    shadowRoot.appendChild(contents);

    const label = document.createElement("span");
    label.classList.add("label");
    contents.appendChild(label);

    const slot = document.createElement("slot");
    contents.appendChild(slot);
  }

  connectedCallback() {
    const label = this.getAttribute('label') || '';
    const labelSpan = this.shadowRoot.querySelector('.label');
    labelSpan.textContent = label;

    const slot = this.shadowRoot.querySelector('slot');

    slot.addEventListener('slotchange', () => {
      if (this.dataset.level === undefined) {
        this.dataset.level = 1;
      }
      const level = Number.parseInt(this.dataset.level, 0);

      const nestedSegments = slot.assignedElements();
      nestedSegments.forEach(segment => {
        segment.dataset.level = level + 1;
      });
    });
  }
}

export default FeelingSegment;
