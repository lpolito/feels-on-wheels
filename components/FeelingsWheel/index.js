// safari doesn't support css type import yet, do some nonsense below
// import styles from './styles.css' with { type: 'css' };

const stylesheet = document.querySelector('[href="components/FeelingsWheel/styles.css"]').sheet;
const stylesheetRules = [...stylesheet.cssRules];
const stylesheetText = stylesheetRules.reduce((accumulator, rule) => accumulator + rule.cssText, '');
const styles = new CSSStyleSheet();
styles.replace(stylesheetText);

class FeelingsWheel extends HTMLElement {
  constructor() {
    super();

    const container = document.createElement("div");
    container.innerHTML = `
       <slot></slot>
    `;

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [styles];
    shadowRoot.appendChild(container);
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');

    slot.addEventListener('slotchange', () => {
      const segments = slot.assignedElements();
      const numberOfSegments = segments.length;

      segments.forEach((child, idx) => {
        // data attributes (child.dataset) don't seem to propogate
        // set inline style vars to ensure css has access to these values
        child.style.setProperty("--i", idx);
        child.style.setProperty("--total", numberOfSegments);
      });
    });
  }
}

export default FeelingsWheel;
