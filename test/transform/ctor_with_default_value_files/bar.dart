library bar;

import 'package:angular2/src/core/annotations/annotations.dart';

@Directive(context: 'soup')
class Component {
  final dynamic c;
  Component([this.c = 'sandwich']);
}
