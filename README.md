# Sisyphus User Interface

##What is a Sisyphus?
Sisyphus is a (sometimes small, sometimes large) circular kinetic sculpture. There is a shallow bed of sand with a metal ball atop.
A motor below the bed of sand will move the metal ball via a magnet. As the ball moves, it leaves behind dunes in the sand. As it progresses through it's path, only certain dunes survive, thus leaving behind the art.

##Why the interface?
The old Sisyphus was designed by an engineer, for an engineer. It was full of technical options and data that were not necessarily relevant to a user, thus making it confusing and cluttered.
This interface is a clean, easy-to-use controller. It's web based, meaning a user can access it from anywhere so long as they have an internet connection. Additionally, this interface is optimized for mobile devices, so it looks great no matter how you choose to access it.

##How does it work?
After starting it up, the server will listen to connection requests from users as well as Sisyphus devices (Sisbots).
When a sisbot connects, through a series of websocket events it will send it's serial number, SID, and all of it's paths and playlists. The server will request/add these to the database as necessary.
When a user connects, they will log in. Upon login, they will see the main controller. Here they can select a Sisyphus to command and send their commands to it.
If there are multiple people/browsers controlling a single Sisbot, when any one of them makes a change, all others will recieve the change and update the interface accordingly.


##For more info
For info on The Art of Motion Control and the Sisyphus itself, [see http://www.taomc.com/](http://www.taomc.com/).

For info on this interface, email me at nickrenfo@gmail.com
