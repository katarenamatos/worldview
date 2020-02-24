import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SimpleBarReact from 'simplebar-react';

/**
 * Wrapper component for SimpleBar
 */
export default function Scrollbars(props) {
  const ref = useRef();
  const [scrollTop, updateScrollTop] = useState(0);

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    function toggleVisibleClass() {
      const { contentEl, contentWrapperEl } = ref.current;
      if (contentEl.offsetHeight > contentWrapperEl.offsetHeight) {
        contentEl.classList.add('scrollbar-visible');
      } else {
        contentEl.classList.remove('scrollbar-visible');
      }
    };
    setTimeout(toggleVisibleClass, 200);
    // If scroll content is being loaded asynchronously,
    // we don't have a reliable way to know when to re-check.
    // So, this is a clumsy safeguard.
    setTimeout(toggleVisibleClass, 600);
  });

  /**
   *  - Set scroll top when prop changes
   *  - Add/remove 'scrollbar-visible' class based on content size
   */
  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }
    function setScrollTop() {
      const { contentWrapperEl } = ref.current;
      const { scrollBarVerticalTop } = props;
      if (contentWrapperEl) {
        updateScrollTop(scrollBarVerticalTop);
        contentWrapperEl.scrollTop = scrollBarVerticalTop;
      }
    };
    setTimeout(setScrollTop, 100);
  }, [props.scrollBarVerticalTop]);

  /**
   * Handle register/deregister of scroll event listener
   */
  useEffect(() => {
    if (!props.onScroll) return;
    const { contentWrapperEl } = ref && ref.current;
    function scrollListener() {
      // Avoid calling event listener when we are setting scrollTop manually
      if (contentWrapperEl.scrollTop !== scrollTop) {
        props.onScroll(contentWrapperEl);
      }
    }
    contentWrapperEl.addEventListener('scroll', scrollListener);
    return function cleanUp() {
      contentWrapperEl.removeEventListener('scroll', scrollListener);
    };
  });

  return (
    <SimpleBarReact
      autoHide={false}
      style={props.style}
      className={props.className}
      ref={ref}
    >
      {props.children}
    </SimpleBarReact>
  );
}

Scrollbars.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  scrollBarVerticalTop: PropTypes.number,
  style: PropTypes.object
};

Scrollbars.defaultProps = {
  scrollBarVerticalTop: 0
};
