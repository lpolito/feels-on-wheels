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

    const segmentContainer = document.createElement("div");
    segmentContainer.classList.add("segment");

    const innerSpan = document.createElement("span");
    innerSpan.innerHTML = `
       <slot></slot>
    `;

    segmentContainer.appendChild(innerSpan);

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [styles];
    shadowRoot.appendChild(segmentContainer);
  }
}

export default FeelingSegment;
