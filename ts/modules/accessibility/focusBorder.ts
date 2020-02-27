/* *
 *
 *  (c) 2009-2020 Øystein Moseng
 *
 *  Extend SVG and Chart classes with focus border capabilities.
 *
 *  License: www.highcharts.com/license
 *
 *  !!!!!!! SOURCE GETS TRANSPILED BY TYPESCRIPT. EDIT TS FILE ONLY. !!!!!!!
 *
 * */

'use strict';

import H from '../../parts/Globals.js';
import U from '../../parts/Utilities.js';
const {
    addEvent,
    extend,
    pick
} = U;

declare global {
    namespace Highcharts {
        interface Chart {
            focusElement?: SVGElement;
            /** @requires modules/accessibility */
            setFocusToElement(
                svgElement: SVGElement,
                focusElement?: (HTMLDOMElement|SVGDOMElement)
            ): void;
        }
        interface SVGElement {
            focusBorder?: SVGElement;
            /** @requires modules/accessibility */
            addFocusBorder(margin: number, style: CSSObject): void;
            /** @requires modules/accessibility */
            removeFocusBorder(): void;
        }
    }
}


/* eslint-disable no-invalid-this, valid-jsdoc */

/*
 * Add focus border functionality to SVGElements. Draws a new rect on top of
 * element around its bounding box. This is used by multiple components.
 */
extend(H.SVGElement.prototype, {

    /**
     * @private
     * @function Highcharts.SVGElement#addFocusBorder
     *
     * @param {number} margin
     *
     * @param {Highcharts.CSSObject} style
     */
    addFocusBorder: function (
        this: Highcharts.SVGElement,
        margin: number,
        style: Highcharts.CSSObject
    ): void {
        // Allow updating by just adding new border
        if (this.focusBorder) {
            this.removeFocusBorder();
        }
        // Add the border rect
        var bb = this.getBBox(),
            pad = pick(margin, 3);

        bb.x += this.translateX ? this.translateX : 0;
        bb.y += this.translateY ? this.translateY : 0;

        let borderPosX = bb.x - pad,
            borderPosY = bb.y - pad;

        // For text elements, apply x and y offset, #11397.
        if (this.element.nodeName === 'text') {
            const isRotated = !!this.rotation;
            borderPosX = +this.attr('x') - (bb.width * 0.5) - pad +
                // Correct the offset caused by the browser.
                (isRotated ? bb.height * 0.068 : 0);
            borderPosY = +this.attr('y') - (bb.height * 0.5) - pad +
                // Firefox needs different correction value.
                (isRotated ? 0 : -bb.height * (H.isFirefox ? 0.25 : 0.068));
        }

        this.focusBorder = this.renderer.rect(
            borderPosX,
            borderPosY,
            bb.width + 2 * pad,
            bb.height + 2 * pad,
            parseInt((style && style.borderRadius || 0).toString(), 10)
        )
            .addClass('highcharts-focus-border')
            .attr({
                zIndex: 99
            })
            .add(this.parentGroup);

        if (!this.renderer.styledMode) {
            this.focusBorder.attr({
                stroke: style && style.stroke,
                'stroke-width': style && style.strokeWidth
            });
        }
    },

    /**
     * @private
     * @function Highcharts.SVGElement#removeFocusBorder
     */
    removeFocusBorder: function (this: Highcharts.SVGElement): void {
        if (this.focusBorder) {
            this.focusBorder.destroy();
            delete this.focusBorder;
        }
    }
});


/**
 * Set chart's focus to an SVGElement. Calls focus() on it, and draws the focus
 * border. This is used by multiple components.
 *
 * @private
 * @function Highcharts.Chart#setFocusToElement
 *
 * @param {Highcharts.SVGElement} svgElement
 *        Element to draw the border around.
 *
 * @param {SVGDOMElement|HTMLDOMElement} [focusElement]
 *        If supplied, it draws the border around svgElement and sets the focus
 *        to focusElement.
 */
H.Chart.prototype.setFocusToElement = function (
    this: Highcharts.AccessibilityChart,
    svgElement: Highcharts.SVGElement,
    focusElement?: (Highcharts.HTMLDOMElement|Highcharts.SVGDOMElement)
): void {
    var focusBorderOptions: (
            Highcharts.AccessibilityKeyboardNavigationFocusBorderOptions
        ) = this.options.accessibility.keyboardNavigation.focusBorder,
        browserFocusElement = focusElement || svgElement.element;

    // Set browser focus if possible
    if (
        browserFocusElement &&
        browserFocusElement.focus
    ) {
        // If there is no focusin-listener, add one to work around Edge issue
        // where Narrator is not reading out points despite calling focus().
        if (!(
            (browserFocusElement as any).hcEvents &&
            (browserFocusElement as any).hcEvents.focusin
        )) {
            addEvent(browserFocusElement, 'focusin', function (): void {});
        }

        browserFocusElement.focus();

        // Hide default focus ring
        if (focusBorderOptions.hideBrowserFocusOutline) {
            browserFocusElement.style.outline = 'none';
        }
    }
    if (focusBorderOptions.enabled) {
        // Remove old focus border
        if (this.focusElement) {
            this.focusElement.removeFocusBorder();
        }
        // Draw focus border (since some browsers don't do it automatically)
        svgElement.addFocusBorder(focusBorderOptions.margin, {
            stroke: focusBorderOptions.style.color,
            strokeWidth: focusBorderOptions.style.lineWidth,
            borderRadius: focusBorderOptions.style.borderRadius
        });
        this.focusElement = svgElement;
    }
};
