'use strict';
var testData = {
  guests: [
    { id:  1, name: "Alice" },
    { id:  2, name: "Bob" },
    { id:  3, name: "Carol" },
    { id:  4, name: "Dan" },
    { id:  5, name: "Erin" },
    { id:  6, name: "Frank" },
    { id:  7, name: "Oscar" },
    { id:  8, name: "Peggy" },
    { id:  9, name: "Sam" },
    { id: 10, name: "Wendy" }
  ],
  tables: [
    { id: 1, guests: [1,2,3,4,5,6,null,null] },
    { id: 2, guests: [7,8,null,null,9,10,null,null] }
  ]
};
