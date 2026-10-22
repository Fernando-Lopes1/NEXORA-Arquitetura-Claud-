<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Core\Application\Contracts\QueryBusInterface;
use App\Core\Application\Queries\ObterDashboardKpisQuery;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(
        private readonly QueryBusInterface $queryBus
    ) {
    }

    public function index(): View
    {
        $kpis = $this->queryBus->ask(new ObterDashboardKpisQuery());

        return view('dashboard.index', compact('kpis'));
    }
}
