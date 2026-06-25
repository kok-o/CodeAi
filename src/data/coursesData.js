export const coursesList = [
  {
    id: 1,
    title: "Python: Zero to Hero",
    level: "Beginner",
    students: "12k",
    rating: 4.8,
    category: "Python",
    color: "#3776ab",
    description: "Learn Python from scratch. Master basic syntax, data structures, variables, loop concepts, and functions with step-by-step practical assignments.",
    lessons: [
      {
        id: "py-1",
        title: "Introduction to Functions",
        subtitle: "Lesson 1.1",
        estimatedTime: "10 mins",
        instructions: "Functions are reusable blocks of code. In this lesson, you will write a function named `welcome_user(name)` that takes a name as a parameter and **prints** a greeting: `Hello, [name]!`. Note the exact punctuation: a comma after Hello, a space, and an exclamation mark at the end.",
        initialCode: `# Define a function welcome_user that greets the student
def welcome_user(name):
    # TODO: Print greeting
    pass

# Test your function
welcome_user("Student")`,
        language: "python",
        testCases: [
          { input: ["Alice"], expected: "Hello, Alice!", type: "stdout", functionName: "welcome_user" },
          { input: ["Charlie"], expected: "Hello, Charlie!", type: "stdout", functionName: "welcome_user" }
        ],
        solutionCode: `def welcome_user(name):
    print("Hello, " + name + "!")`
      },
      {
        id: "py-2",
        title: "Variables and Math",
        subtitle: "Lesson 1.2",
        estimatedTime: "15 mins",
        instructions: "Let's perform calculations using variables. Complete the function `circle_area(radius)` which calculates and **returns** the area of a circle. Use `3.14` as the value of Pi. The formula is `Area = 3.14 * (radius ** 2)`. Make sure to use `return` instead of printing.",
        initialCode: `# Calculate the area of a circle
def circle_area(radius):
    # TODO: Calculate and return area using Pi = 3.14
    pass`,
        language: "python",
        testCases: [
          { input: [5], expected: 78.5, type: "return", functionName: "circle_area" },
          { input: [10], expected: 314.0, type: "return", functionName: "circle_area" }
        ],
        solutionCode: `def circle_area(radius):
    return 3.14 * (radius ** 2)`
      },
      {
        id: "py-3",
        title: "Filtering Lists with Loops",
        subtitle: "Lesson 1.3",
        estimatedTime: "20 mins",
        instructions: "Loops let us iterate over lists of data. Complete the function `get_evens(numbers)` which takes a list of integers and **returns** a new list containing only the even integers in their original order. An integer is even if dividing it by 2 leaves a remainder of 0 (`num % 2 == 0`).",
        initialCode: `# Return a list of even integers
def get_evens(numbers):
    # TODO: Filter and return even numbers
    pass`,
        language: "python",
        testCases: [
          { input: [[1, 2, 3, 4, 5, 6]], expected: [2, 4, 6], type: "return", functionName: "get_evens" },
          { input: [[15, 22, 9, 44, 100]], expected: [22, 44, 100], type: "return", functionName: "get_evens" }
        ],
        solutionCode: `def get_evens(numbers):
    evens = []
    for num in numbers:
        if num % 2 == 0:
            evens.append(num)
    return evens`
      }
    ]
  },
  {
    id: 2,
    title: "Modern JavaScript Masterclass",
    level: "Intermediate",
    students: "8k",
    rating: 4.9,
    category: "JavaScript",
    color: "#f7df1e",
    description: "Deep dive into ES6+, arrays, destructuring, promises, and modern asynchronous operations.",
    lessons: [
      {
        id: "js-1",
        title: "Array Filtering",
        subtitle: "Lesson 2.1",
        estimatedTime: "12 mins",
        instructions: "JavaScript arrays provide clean utility methods like `.filter()`. Complete the function `filterNumbers(arr)` that takes an array of numbers and **returns** a new array containing only numbers greater than or equal to 10.",
        initialCode: `// Return numbers greater than or equal to 10
function filterNumbers(arr) {
    // TODO: Write code here
    
}`,
        language: "javascript",
        testCases: [
          { input: [[5, 12, 8, 130, 44]], expected: [12, 130, 44], type: "return", functionName: "filterNumbers" },
          { input: [[1, 2, 9]], expected: [], type: "return", functionName: "filterNumbers" }
        ],
        solutionCode: `function filterNumbers(arr) {
    return arr.filter(num => num >= 10);
}`
      },
      {
        id: "js-2",
        title: "Object Destructuring",
        subtitle: "Lesson 2.2",
        estimatedTime: "15 mins",
        instructions: "Destructuring lets us unpack fields from objects easily. Complete the function `formatUser(user)` which receives a user object (with fields `name`, `age`, and `role`) and **returns** a string in the format: `[name] is a [age] year old [role]`. Use ES6 template literals or string concatenation.",
        initialCode: `// Destructure the user object and format a descriptive string
function formatUser(user) {
    // TODO: Write code here
    
}`,
        language: "javascript",
        testCases: [
          { input: [{ name: "Alex", age: 24, role: "Developer" }], expected: "Alex is a 24 year old Developer", type: "return", functionName: "formatUser" },
          { input: [{ name: "Maria", age: 31, role: "Lead Architect" }], expected: "Maria is a 31 year old Lead Architect", type: "return", functionName: "formatUser" }
        ],
        solutionCode: `function formatUser(user) {
    const { name, age, role } = user;
    return \`\${name} is a \${age} year old \${role}\`;
}`
      }
    ]
  },
  {
    id: 3,
    title: "Full-stack Web Dev: React & Node",
    level: "Advanced",
    students: "15k",
    rating: 4.7,
    category: "Web Dev",
    color: "#61dafb",
    description: "Learn full-stack architectures, query params formatting, database connections, and full state hydration.",
    lessons: [
      {
        id: "web-1",
        title: "URL Query String Builder",
        subtitle: "Lesson 3.1",
        estimatedTime: "15 mins",
        instructions: "Web applications frequently construct URLs. Complete the function `buildQueryString(params)` that takes a parameter object (e.g. `{ search: \"react\", page: 2 }`) and **returns** a URL query string (e.g. `search=react&page=2`). If the parameters object is empty, return an empty string. Key-value pairs should be joined with `&`.",
        initialCode: `// Convert key-value parameters into a query string query
function buildQueryString(params) {
    // TODO: Write code here
    
}`,
        language: "javascript",
        testCases: [
          { input: [{ search: "react", page: 2 }], expected: "search=react&page=2", type: "return", functionName: "buildQueryString" },
          { input: [{}], expected: "", type: "return", functionName: "buildQueryString" }
        ],
        solutionCode: `function buildQueryString(params) {
    return Object.entries(params)
        .map(([key, val]) => \`\${key}=\${val}\`)
        .join('&');
}`
      }
    ]
  }
];
