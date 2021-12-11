import React from 'react';
import './App.scss';
import { Bar } from 'react-chartjs-2';

class RestaurantView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      restaurants: [],
      searchPhrase: '',
      proxies: [],
      xCoord: 0,
      yCoord: 0
    }
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.searchRestaurants = this.searchRestaurants.bind(this);
    this.createGeolocation = this.createGeolocation.bind(this);
  }
  componentDidMount() {
    fetch("http://localhost:3001/restaurants/all", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: "GET",
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          restaurants: data.restaurants
        });
      })
      .catch(error => console.error(error))
  }
  searchRestaurants(e) {
    e.preventDefault();
    let body = {
      searchPhrase: this.state.searchPhrase
    }
    fetch("http://localhost:3001/restaurants/search", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          restaurants: data.restaurants
        });
      })
      .catch(error => console.error(error))
  }
  handleSearchChange(e) {
    this.setState({
      searchPhrase: e.target.value
    });
  }
  createGeolocation(e) {
    e.preventDefault();
    fetch("https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyB5PVhu3mBc3oXiaYuUHi6YgVdYLaRdp70", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "considerIp": "true"
      })
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          xCoord: data.location.lat,
          yCoord: data.location.lng
        })
        let latlong = this.state.xCoord + "," + this.state.yCoord;

        let body = {
          xCoord: this.state.xCoord,
          yCoord: this.state.yCoord
        }
        fetch("http://localhost:3001/restaurants/prox", {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          method: "POST",
          body: JSON.stringify(body)
        })
          .then(response => response.json())
          .then(data => {
            console.log(data);
            this.setState({
              restaurants: data.proxy
            });
            let markers = "";
            let indices = "";
            for (var i = 0; i < this.state.restaurants.length; i++) {
              let number = i + 1;
              let marker = "&markers=color:red|size:normal|label:" + number + "|" + this.state.restaurants[i].xCoord + "," + this.state.restaurants[i].yCoord;
              let index = "<li>" + this.state.restaurants[i].name + "</li>";
              markers += marker;
              indices += index;
            }
            let img_url = "http://maps.googleapis.com/maps/api/staticmap?center=" + latlong + "&zoom=14&size=600x600&sensor=false&markers=color:blue|label:H|" + latlong + markers + "&key=AIzaSyB5PVhu3mBc3oXiaYuUHi6YgVdYLaRdp70";
            document.getElementById("mapholder").innerHTML = "<img src='" + img_url + "'>";
            document.getElementById("index").innerHTML = "<ol>" + indices + "</ol>";
          })
          .catch(error => console.error(error))
      }).catch(error => console.error(error))
  }
  render() {
    const restaurants = this.state.restaurants.map(obj => {
      return (
        <div className="restaurant-container" key={obj.key}>
          <h3 className="click" onClick={() => this.props.switchView('items', obj.id, obj.name)}>{obj.name}</h3>
          <p>{obj.desc}</p>
        </div>
      )
    })
    return (
      <div className="view">
        <h2>Restaurants</h2>
        <form>
          <input id="search-input" type="text" placeholder="i.e. McDonald's" onChange={this.handleSearchChange}></input>
          <input className="dark-button" type="submit" value="Search" onClick={this.searchRestaurants}></input>
          <button className="dark-button" onClick={this.createGeolocation} >What's around me?</button>
        </form>
        <div id = "geotag">
          <p id="mapholder"></p>
          <p id="index"></p>
        </div>
        {restaurants}
      </div>
    );
  }
}

class ItemsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
    }
  }
  componentDidMount() {
    let body = {
      restaurantID: this.props.res_id
    }
    fetch("http://localhost:3001/items/all", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          items: data.items
        });
      })
      .catch(error => console.error(error))
  }
  render() {
    const items = this.state.items.map(obj => {
      var percentage = obj.rating / 5;
      var divStyle = {
        backgroundImage: 'url(five-stars.png',
        height: '30px',
        width: (percentage * 107) + 'px',
        backgroundSize: 'cover'
      }
      return (
        <div className="item-container" key={obj.key}>
          <h3 className="click" onClick={() => this.props.switchView('reviews', obj.id, obj.name)}>{(obj.key + 1) + '. ' + obj.name}</h3>
          <div style={divStyle} />
        </div>
      )
    })
    return (
      <div className="view">
        <div className="header-container">
          <h2>Items at {this.props.res_name}</h2>
          <button className="dark-button" type="button" onClick={() => this.props.switchView('restaurants')}>Back</button>
        </div>
        {items}
      </div>
    );
  }
}
class ReviewsView extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reviews: [],
      rating: 1,
      description: '',
      error: null,
      file: null,
      data: {
        labels: ['1 Star', '2 Stars', '3 stars', '4 stars', '5 stars'],
        datasets: [
          {
            label: 'Number of reviews',
            backgroundColor: 'rgba(255,99,132,0.2)',
            borderColor: 'rgba(255,99,132,1)',
            borderWidth: 1,
            hoverBackgroundColor: 'rgba(255,99,132,0.4)',
            hoverBorderColor: 'rgba(255,99,132,1)',
            data: [0, 0, 0, 0, 0]
          }
        ]
      }
    }
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleRatingChange = this.handleRatingChange.bind(this);
    this.handlePhotoChange = this.handlePhotoChange.bind(this);
    this.handleLike = this.handleLike.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.writeReview = this.writeReview.bind(this);
  }
  componentDidMount() {
    this.fetchReviews();
  }
  fetchReviews() {
    let body = {
      itemID: this.props.item_id
    }
    fetch("http://localhost:3001/reviews/all", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.setState({
          reviews: data.reviews,
          error: null
        });
        var ratingCount = [0, 0, 0, 0, 0];
        for (var i = 0; i < data.reviews.length; i++) {
          ratingCount[(data.reviews[i].rating - 1)]++;
        }
        this.setState({
          data: {
            labels: ['1 Star', '2 Stars', '3 stars', '4 stars', '5 stars'],
            datasets: [
              {
                label: 'Number of Reviews',
                backgroundColor: 'rgba(255,99,132,0.2)',
                borderColor: 'rgba(255,99,132,1)',
                borderWidth: 1,
                hoverBackgroundColor: 'rgba(255,99,132,0.4)',
                hoverBorderColor: 'rgba(255,99,132,1)',
                data: ratingCount
              }
            ]
          }
        });
      })
      .catch(error => console.error(error))
  }
  handleDescriptionChange(e) {
    this.setState({
      description: e.target.value
    });
  }
  handleRatingChange(e) {
    this.setState({
      rating: e.target.value
    });
  }
  handlePhotoChange(e) {
    this.setState({
      file: e.target.files[0]
    });
  }
  writeReview(e) {
    e.preventDefault();
    let body = new FormData();
    body.append('itemID', this.props.item_id);
    body.append('rating', this.state.rating);
    body.append('description', this.state.description);
    body.append('photo', this.state.file);
    fetch("http://localhost:3001/reviews/add", {
      credentials: 'include',
      method: "POST",
      body: body
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.success) {
          this.fetchReviews();
        } else {
          this.setState({
            error: data.message
          })
        }
      })
      .catch(error => console.log(error))
  }
  handleDelete(reviewID, key) {
    let body = {
      reviewID: reviewID
    }
    fetch("http://localhost:3001/reviews/delete", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.success) {
          this.fetchReviews();
        } else {
          var currentRev = this.state.reviews;
          currentRev[key].error = data.message;
          this.setState({
            reviews: currentRev
          });
        }
      })
      .catch(error => console.error(error))
  }
  handleLike(reviewID, key) {
    let body = {
      reviewID: reviewID
    }
    fetch("http://localhost:3001/reviews/like", {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.success) {
          this.fetchReviews();
        } else {
          var currentRev = this.state.reviews;
          currentRev[key].error = data.message;
          this.setState({
            reviews: currentRev
          });
        }
      })
      .catch(error => console.error(error))
  }
  render() {
    const reviews = this.state.reviews.map(obj => {
      var percentage = obj.rating / 5;
      var divStyle = {
        backgroundImage: 'url(five-stars.png)',
        height: '30px',
        width: (percentage * 107) + 'px',
        backgroundSize: 'cover'
      }
      var imgStyle = {
        height: "200px",
        width: "auto"
      }
      return (
        <div className="review-container" key={obj.key}>
          <h3>{obj.username}</h3>
          <div style={divStyle} />
          <p>{obj.description}</p>
          {obj.image ? <img style={imgStyle} src={'data:image/png;base64,' + obj.image} alt="Food item"></img> : null}
          <span className="like-count">{obj.likes} likes</span>
          <button id="like-button" className="dark-button" onClick={() => this.handleLike(obj.id, obj.key)}>Like</button>
          <button id="delete-button" className="dark-button" onClick={() => this.handleDelete(obj.id, obj.key)}>Delete</button>
          {obj.error ? <span className="delete-error">{obj.error}</span> : null}
        </div>
      )
    })
    return (
      <div className="view">
        <Bar data={this.state.data} options={{
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true,
                  stepSize: 1
                }
              }]
            }
          }} />
          <div className="header-container">
            <h2>Reviews of {this.props.item_name}</h2>
            <button className="dark-button" type="button" onClick={() => this.props.switchView('items', this.props.res_id, this.props.res_name)}>Back</button>
          </div>
          <form className="review-container">
            <h3>Write a Review:</h3>
            <textarea rows="5" id="description-input" placeholder="Great food!" onChange={this.handleDescriptionChange}></textarea>
            <input type="file" onChange={this.handlePhotoChange}></input>
            <select id="rating-input" name="rating" onChange={this.handleRatingChange}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <input className="dark-button" type="submit" value="Submit Review" onClick={this.writeReview}></input>
            <span id="review-error">{this.state.error}</span>
          </form>
        {reviews}
      </div>
      );
    }
  }
  
class View extends React.Component {
          constructor(props) {
          super(props);
    this.state = {
          mode: 'restaurants',
        res_id: null,
        res_name: null,
        item_id: null,
        item_name: null
      }
      this.switchView = this.switchView.bind(this);
    }
  switchView(mode, id, name) {
    switch (mode) {
      case 'restaurants':
        this.setState({
          mode: 'restaurants'
      });
      break;
    case 'items':
        this.setState({
          mode: 'items',
        res_id: id,
        res_name: name
      });
      break;
    case 'reviews':
        this.setState({
          mode: 'reviews',
        item_id: id,
        item_name: name
      });
      break;
    default:
  }
}
  getView() {
    switch (this.state.mode) {
      case 'restaurants':
        return <RestaurantView switchView={this.switchView} />
        case 'items':
        return <ItemsView switchView={this.switchView} res_id={this.state.res_id} res_name={this.state.res_name} />
        case 'reviews':
        return <ReviewsView switchView={this.switchView} res_id={this.state.res_id} res_name={this.state.res_name} item_id={this.state.item_id} item_name={this.state.item_name} />
        default:
      }
    }
  render() {
    return this.getView()
      }
    }
    
class NavBar extends React.Component {
          constructor(props) {
          super(props)
    this.state = {
          usernameInput: '',
        passwordInput: ''
      }
      this.handlePasswordChange = this.handlePasswordChange.bind(this);
      this.handleUsernameChange = this.handleUsernameChange.bind(this);
      this.clearInput = this.clearInput.bind(this);
    }
  handleUsernameChange(e) {
          this.setState({
            usernameInput: e.target.value
          });
      }
  handlePasswordChange(e) {
          this.setState({
            passwordInput: e.target.value
          });
      }
  clearInput() {
          this.setState({
            usernameInput: '',
            passwordInput: ''
          });
      }
  render() {
    return (
      <nav id="nav-container">
          <h1>GULP</h1>
          {this.props.authenticated ?
            <form className="user-form">
              <span id="welcome-text">Welcome, {this.props.username}</span>
              <button id="logout-button" className="light-button" type="button" onClick={this.props.logout}>Logout</button>
            </form>
            :
            <form className="user-form">
              <label htmlFor="username-input">Username:</label>
              <input id="username-input" className="text-input" type="text" autoComplete="username" onChange={this.handleUsernameChange}></input>
              <label htmlFor="password-input">Password:</label>
              <input id="password-input" className="text-input" type="password" autoComplete="current-password" onChange={this.handlePasswordChange}></input>
              <button id="login-button" className="light-button" type="submit" onClick={(e) => this.props.login(e, this.state.usernameInput, this.state.passwordInput, this.clearInput)}>Login</button>
              <button id="register-button" className="light-button" type="button" onClick={() => this.props.register(this.state.usernameInput, this.state.passwordInput, this.clearInput)}>Register</button>
              <span id="login-error">{this.props.error}</span>
            </form>
          }
        </nav>
        )
      }
    }
    
class App extends React.Component {
          constructor(props) {
          super(props);
    this.state = {
          authenticated: false,
        username: '',
        loginError: null
      }
      this.login = this.login.bind(this);
      this.register = this.register.bind(this);
      this.logout = this.logout.bind(this);
    }
  componentDidMount() {
          fetch("http://localhost:3001/users/auth", {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            method: "GET",
          })
            .then(response => response.json())
            .then(data => {
              console.log(data);
              if (data.success) {
                this.setState({
                  authenticated: true,
                  username: data.username,
                  loginError: null
                });
              }
            })
            .catch(error => console.error(error));
    }
  logout() {
          fetch("http://localhost:3001/users/logout", {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            method: "GET",
          })
            .then(response => response.json())
            .then(data => {
              console.log(data);
              this.setState({
                authenticated: false,
                username: ''
              })
            })
            .catch(error => console.error(error))
        }
        login(e, username, password, clear) {
          e.preventDefault();
    let body = {
          username: username,
        password: password
      }
    fetch("http://localhost:3001/users/login", {
          credentials: 'include',
      headers: {
          'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
          console.log(data);
        if (data.success) {
          clear();
          this.setState({
          authenticated: true,
        username: data.username,
        loginError: null
      })
        } else {
          this.setState({
            loginError: data.message
          });
      }
    })
    .catch(error => console.error(error))
}
  register(username, password, clear) {
          clear();
    let body = {
          username: username,
        password: password
      }
    fetch("http://localhost:3001/users/register", {
          credentials: 'include',
      headers: {
          'Content-Type': 'application/json'
      },
      method: "POST",
      body: JSON.stringify(body)
    })
      .then(response => response.json())
      .then(data => {
          console.log(data);
        if (data.success) {
          clear();
          this.setState({
          authenticated: true,
        username: data.username,
        loginError: null
      })
        } else {
          this.setState({
            loginError: data.message
          });
      }
    })
    .catch(error => console.error(error))
}
  render() {
    return (
      <div className="page-wrapper">
        <NavBar authenticated={this.state.authenticated} error={this.state.loginError} username={this.state.username} logout={this.logout} login={this.login} register={this.register} />
        <View />
      </div>
    )
  }
}

export default App;
