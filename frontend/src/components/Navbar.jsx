import React from 'react'
import { Link } from 'react-router-dom'


export default function Navbar(){
return (
<nav className="bg-white shadow p-3 mb-4">
<div className="container mx-auto flex justify-between">
<div className="font-bold">PTIS</div>
<div className="flex gap-4">
<Link to="/">Login</Link>
<Link to="/admin">Admin</Link>
</div>
</div>
</nav>
)
}


