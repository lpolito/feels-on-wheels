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

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [styles];

    const container = document.createElement("div");
    container.innerHTML = `
       <slot></slot>
    `;
    shadowRoot.appendChild(container);
  }

  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    wrapElements(slot);

    slot.addEventListener('slotchange', () => {
      const totalLeafSegments = countLeafSegments(this);

      const assignedElements = slot.assignedElements();
      const leafCountBySegment = assignedElements.map(segment => {
        const count = countLeafSegments(segment);
        // if count comes back 0, assume it is a leaf
        return count || 1;
      });

      let accumulatedDegrees = 0;
      assignedElements.forEach((element, idx) => {

        const segmentRatio = leafCountBySegment[idx] / totalLeafSegments;
        console.log(leafCountBySegment)
        const segmentDegrees = segmentRatio * 360;
        // Calculate the midpoint angle of this specific slice
        const midpointDegrees = accumulatedDegrees + (segmentDegrees / 2);

        // data attributes (child.dataset) don't seem to propogate
        // set inline style vars to ensure css has access to these values
        // element.style.setProperty("--segment-ratio", segmentRatio);
        element.style.setProperty("--segment-rotation", `${midpointDegrees}deg`);

        accumulatedDegrees += segmentDegrees;
      });
    });
  }
}

function countLeafSegments(node) {
  // I have no idea how bad of an idea this is.
  // I don't really know how the shadow dom plays with the light dom, so this could be fragile.
  const segments = Array.from(node.querySelectorAll('feeling-segment'));

  const totalLeafs = segments.reduce((acc, segment) => {
    return segment.children.length > 0 ? acc : (acc + 1);
  }, 0);

  return totalLeafs;
}

function wrapElements(slot) {
  slot.assignedElements().forEach(el => {
    // prevent double wrapping on slotchange
    if (el.parentElement.classList.contains('wedge')) {
      return;
    };

    const wrapper = document.createElement('div');
    wrapper.className = 'wedge';

    el.replaceWith(wrapper);
    wrapper.appendChild(el);
  });
}

export default FeelingsWheel;
