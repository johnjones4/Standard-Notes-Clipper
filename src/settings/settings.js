import { h, render } from 'preact'
import 'regenerator-runtime'
import SettingsPage from './components/SettingsPage'
import 'bootstrap/dist/css/bootstrap.min.css'
import './settings.css'

render(h(SettingsPage), document.getElementById('options'))
