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

    const dividerCircle = document.createElement("span");
    dividerCircle.classList.add("dividerCircle");
    dividerCircle.id = "dividerCircle";
    container.appendChild(dividerCircle);

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [styles];
    shadowRoot.appendChild(container);
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');

    slot.addEventListener('slotchange', () => {
      const segments = slot.assignedElements();
      const numberOfSegments = segments.length;

      const dividerCircle = this.shadowRoot.querySelector("#dividerCircle");
      dividerCircle.style.setProperty("--total", numberOfSegments);

      const divider = document.createElement("span");
      divider.classList.add("divider");

      segments.forEach((child, idx) => {
        // data attributes (child.dataset) don't seem to propogate
        // set inline style vars to ensure css has access to these values
        child.style.setProperty("--i", idx);
        child.style.setProperty("--total", numberOfSegments);

        const dividerClone = divider.cloneNode(true);
        dividerClone.style.setProperty("--i", idx);
        dividerCircle.appendChild(dividerClone);
      });

      // Array.from({ length: numberOfSegments }, (_, i) => {
      //   const dividerClone = divider.cloneNode(true);
      //   dividerClone.style.setProperty("--i", idx);
      //   // dividerCircle.appendChild()
      // });

      // add the segment dividers
      // <span class="circle" :style="{ transform: `rotate(-${angle / 2}deg)` }">
      //     <span
      //       class="line"
      //       v-for="(_, key) in sectors"
      //       :key="key"
      //       :style="getItemAngle(key)"
      //     />
      //   </span>


    });
  }
}

export default FeelingsWheel;
