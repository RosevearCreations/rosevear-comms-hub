# Remote Operator Note — QL-079 First Safe Interaction Plan

QL-079 selects the first safe public-preview interaction but does not enable it yet.

## Selected interaction

The selected first safe interaction is the sample brand switcher.

The next implementation may allow the public preview to switch between Rosie Dazzlers and Devil n Dove sample panels using browser-local React state and synthetic data only.

## Do not enable

Do not enable or simulate any of the following as real runtime behavior:

- provider connection;
- callback registration;
- live phone webhook handling;
- SMS sending;
- call runtime;
- recording;
- AI send;
- persistence writes;
- live customer reads or writes;
- archive writes;
- retention writes;
- live pilot runtime.

## Manual intervention

No manual intervention is required for QL-079 beyond reviewing the public preview after Pages deployment is green.
