# Requirements Document

## Introduction

This enhancement adds an emoji picker bar to the InputBox component used for writing desabafos. The emoji bar provides a curated set of diverse emojis that users can click to insert directly into their text at the current cursor position, enriching emotional expression in their anonymous confessions.

## Glossary

- **Emoji_Picker_Bar**: A horizontal bar UI element displayed within the InputBox component that contains clickable emoji buttons
- **InputBox**: The existing React component where users compose their desabafo text, containing a textarea, sentiment selector, and publish button
- **Cursor_Position**: The current text insertion point (caret) within the textarea where new characters will be placed
- **Emoji_Set**: The predefined collection of diverse emojis available in the Emoji_Picker_Bar for user selection
- **Desabafo**: An anonymous confession or emotional text posted by a user

## Requirements

### Requirement 1: Display Emoji Picker Bar

**User Story:** As a user writing a desabafo, I want to see a bar with diverse emojis, so that I can easily add emotional expression to my text.

#### Acceptance Criteria

1. WHILE the InputBox component is rendered, THE Emoji_Picker_Bar SHALL display a horizontal row of clickable emoji buttons
2. THE Emoji_Picker_Bar SHALL contain a diverse set of emojis representing different emotions and expressions (minimum 8 emojis)
3. THE Emoji_Picker_Bar SHALL be positioned between the textarea and the controls section (sentiment buttons and publish button)
4. THE Emoji_Picker_Bar SHALL be styled consistently with the existing InputBox design using the project CSS custom properties
5. WHILE the InputBox is in the publishing state (isPublicando), THE Emoji_Picker_Bar SHALL disable all emoji buttons

### Requirement 2: Insert Emoji at Cursor Position

**User Story:** As a user, I want to click an emoji and have it inserted at my cursor position in the text, so that I can place emojis exactly where I want them.

#### Acceptance Criteria

1. WHEN a user clicks an emoji button, THE InputBox SHALL insert the selected emoji character at the current Cursor_Position in the textarea
2. WHEN an emoji is inserted, THE InputBox SHALL update the Cursor_Position to be immediately after the inserted emoji
3. WHEN an emoji is inserted and no cursor position is set (textarea has not been focused), THE InputBox SHALL append the emoji at the end of the existing text
4. WHEN an emoji is inserted, THE InputBox SHALL maintain focus on the textarea so the user can continue typing
5. WHEN an emoji is inserted, THE InputBox SHALL respect the existing maximum character limit (2000 characters) and count the emoji as part of the text length

### Requirement 3: Emoji Set Curation

**User Story:** As a user, I want a diverse selection of emojis available, so that I can express a variety of emotions in my desabafo.

#### Acceptance Criteria

1. THE Emoji_Set SHALL include emojis from multiple emotional categories: happy, sad, angry, love, surprise, and common expressions
2. THE Emoji_Set SHALL be defined as a static constant array within the component module
3. THE Emoji_Picker_Bar SHALL render each emoji from the Emoji_Set as an individual clickable button with appropriate aria-label describing the emoji

### Requirement 4: Accessibility

**User Story:** As a user relying on assistive technology, I want the emoji picker to be fully accessible, so that I can use it with keyboard navigation and screen readers.

#### Acceptance Criteria

1. THE Emoji_Picker_Bar SHALL have a role of "toolbar" with an aria-label of "Emojis"
2. WHEN a user navigates the Emoji_Picker_Bar with keyboard, THE Emoji_Picker_Bar SHALL support Tab key to enter and leave the bar
3. THE Emoji_Picker_Bar SHALL render each emoji button with a descriptive aria-label (the emoji name in Portuguese)

### Requirement 5: Responsive Layout

**User Story:** As a user on a mobile device, I want the emoji bar to adapt to smaller screens, so that I can still access all emojis comfortably.

#### Acceptance Criteria

1. THE Emoji_Picker_Bar SHALL wrap emoji buttons to multiple lines when the container width is insufficient to display all emojis in a single row
2. THE Emoji_Picker_Bar SHALL maintain consistent spacing between emoji buttons across all screen sizes
