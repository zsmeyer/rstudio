/*
 * navigation.ts
 *
 * Copyright (C) 2020 by RStudio, PBC
 *
 * Unless you have received this program directly from RStudio pursuant
 * to the terms of a commercial license agreement with RStudio, then
 * this program is licensed to you under the terms of version 3 of the
 * GNU Affero General Public License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * AGPL (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.
 *
 */

import { EditorView } from 'prosemirror-view';

import { setTextSelection, Predicate, findChildren } from 'prosemirror-utils';

import zenscroll from 'zenscroll';

import { editingRootNode } from './node';

export interface EditorNavigation {
  navigate: (type: NavigationType, location: string, animate?: boolean) => void;
}

export enum NavigationType {
  Pos = "pos",
  Id = "id",
  Href = "href",
  Heading = "heading",
  Top = "top"
}

export interface Navigation {
  pos: number;
  prevPos: number;
}

export function navigateTo(view: EditorView, type: NavigationType, location: string, animate = true): Navigation | null {

  switch (type) {
    case NavigationType.Pos:
      return navigateToPos(view, parseInt(location, 10), animate);
    case NavigationType.Id:
      return navigateToId(view, location, animate);
    case NavigationType.Href:
      return navigateToHref(view, location, animate);
    case NavigationType.Heading:
      return navigateToHeading(view, location, animate);
    case NavigationType.Top:
      return navigateToTop(view, animate);
    default:
      return null;
  }
}

export function navigateToId(view: EditorView, id: string, animate = true): Navigation | null {
  return navigate(view, node => id === node.attrs.navigation_id, animate);
}

export function navigateToHref(view: EditorView, href: string, animate = true): Navigation | null {
  return navigate(view, node => node.attrs.id === href, animate);
}

export function navigateToHeading(view: EditorView, heading: string, animate = true): Navigation | null {
  return navigate(
    view,
    node => {
      return (
        node.type === view.state.schema.nodes.heading &&
        node.textContent.localeCompare(heading, undefined, { sensitivity: 'accent' }) === 0
      );
    },
    animate,
  );
}

export function navigateToPos(view: EditorView, pos: number, animate = true): Navigation | null {

  // get previous position
  const prevPos = view.state.selection.from;

  // set selection
  view.dispatch(setTextSelection(pos)(view.state.tr));

  // scroll to selection
  const node = view.domAtPos(pos).node;
  if (node instanceof HTMLElement) {

    // perform navigation
    const editingRoot = editingRootNode(view.state.selection)!;
    const container = view.nodeDOM(editingRoot.pos) as HTMLElement;
    const scroller = zenscroll.createScroller(container, 700, 20);
    if (animate) {
      scroller.to(node);
    } else {
      scroller.to(node, 0);
    }

    return { pos, prevPos };

  } else {
    return null;
  }
}

export function navigateToTop(view: EditorView, animate = true): Navigation | null {
  return navigateToPos(view, 2, animate);
}

// TODO: we added a +1 here to make the targeting of nodes consistent however this
// would have been causing us to 'miss' later when calling view.nodeDOM. We 
// switched to calling view.domAtPos (above) but that may not be correct either?
// do we need to call both? How do we normalize these positions? (maybe it's 
// view.nodeDOM(pos - 1) to pickup both cases?)

function navigate(view: EditorView, predicate: Predicate, animate = true): Navigation | null {
  const result = findChildren(view.state.doc, predicate);
  if (result.length) {
    return navigateToPos(view, result[0].pos + 1, animate);
  } else {
    return null;
  }
}

